'use client';

import { FormEvent, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

type Step = 1 | 2 | 3;

interface BaseData {
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  password: string;
}

interface FormState {
  email: string;
  phone: string;
}

export default function RegisterDirectorPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [baseData, setBaseData] = useState<BaseData>({
    firstName: '',
    lastName: '',
    middleName: '',
    birthDate: '',
    password: '',
  });
  const [form, setForm] = useState<FormState>({
    email: '',
    phone: '',
  });
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Создаем клиент Supabase через useMemo
  const supabase = useMemo<SupabaseClient | null>(() => {
    try {
      return createBrowserSupabaseClient();
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }, []);

  // Сбрасываем ошибки при смене шага
  useEffect(() => {
    setFormError(null);
    setFormSuccess(null);
    // При выходе со шага 2 сбрасываем состояния email
    if (step !== 2) {
      setEmailSent(false);
      setEmailVerified(false);
    }
  }, [step]);

  // Ref для хранения ID интервала
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Ref для отслеживания текущего состояния emailVerified
  const emailVerifiedRef = useRef(emailVerified);

  // Подписка на изменения авторизации для отслеживания подтверждения email
  useEffect(() => {
    if (!supabase || step !== 2) return;

    // Обновляем ref при изменении состояния
    emailVerifiedRef.current = emailVerified;

    // Функция проверки подтверждения email
    const checkEmailVerified = async () => {
      // Если уже подтверждено - не проверяем
      if (emailVerifiedRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      setIsCheckingVerification(true);

      try {
        // Сначала проверяем localStorage флаг
        const localStorageFlag = localStorage.getItem('wellify_email_confirmed') === 'true';
        
        // Получаем пользователя
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (!userError && userData.user) {
          const user = userData.user;
          let isVerified = false;

          // 1) Проверяем поля auth
          if (user.email_confirmed_at || (user as any).confirmed_at) {
            isVerified = true;
          }

          // 2) Дополнительно проверяем профиль (если в auth не подтверждено)
          if (!isVerified) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('email_verified')
              .eq('id', user.id)
              .single();

            if (!profileError && profile?.email_verified) {
              isVerified = true;
            }
          }

          // Если localStorage флаг установлен ИЛИ пользователь подтвержден - обновляем состояние
          if (localStorageFlag || isVerified) {
            emailVerifiedRef.current = true;
            setEmailVerified(true);
            // Останавливаем интервал
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        } else if (localStorageFlag) {
          // Если нет пользователя, но есть флаг в localStorage - все равно считаем подтвержденным
          emailVerifiedRef.current = true;
          setEmailVerified(true);
          // Останавливаем интервал
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
      } finally {
        setIsCheckingVerification(false);
      }
    };

    // Функция для синхронизации профиля в БД (минимально: id + email)
    const syncProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { id, email } = user;

        const { error } = await supabase.from('profiles').upsert(
          {
            id,
            email,
          },
          {
            onConflict: 'id',
          },
        );

        if (error) {
          console.error('Error upserting profile', error);
        }
      } catch (err) {
        console.error('Unexpected error syncing profile', err);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) return;

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const user = session.user;
        if (user.email_confirmed_at || (user as any).confirmed_at) {
          emailVerifiedRef.current = true;
          setEmailVerified(true);
          // Останавливаем интервал
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Синхронизируем профиль после подтверждения
          syncProfile().catch(console.error);
        }
      }
    });

    // Проверяем подтверждение при открытии шага 2, если письмо уже отправлено
    if (emailSent) {
      checkEmailVerified().catch(console.error);
    }

    // Слушаем события localStorage для синхронизации между вкладками
    const handleStorageChange = (e: StorageEvent | Event) => {
      if (e.type === 'storage' || e.type === 'emailConfirmed') {
        // Немедленно проверяем статус
        checkEmailVerified().catch(console.error);
      }
    };

    // Слушаем событие storage (для синхронизации между вкладками)
    window.addEventListener('storage', handleStorageChange);
    // Слушаем кастомное событие (для синхронизации в текущем окне)
    window.addEventListener('emailConfirmed', handleStorageChange);

    // Периодическая проверка (каждые 1.5 секунды, если письмо отправлено и не подтверждено)
    if (emailSent && !emailVerifiedRef.current) {
      // Очищаем предыдущий интервал, если есть
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        checkEmailVerified().catch(console.error);
      }, 1500);
    }

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('emailConfirmed', handleStorageChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, step, emailSent]);

  const validateStep1 = () => {
    if (!baseData.firstName.trim() || !baseData.lastName.trim()) {
      setFormError('Укажите имя и фамилию.');
      return false;
    }
    if (!baseData.birthDate.trim()) {
      setFormError('Укажите дату рождения.');
      return false;
    }
    if (!baseData.password || baseData.password.length < 8) {
      setFormError('Пароль должен содержать минимум 8 символов.');
      return false;
    }
    if (baseData.password !== passwordConfirm) {
      setFormError('Пароль и подтверждение пароля не совпадают.');
      return false;
    }
    return true;
  };

  const validateEmail = () => {
    if (!form.email.trim()) {
      setFormError('Укажите e-mail.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setFormError('Укажите корректный e-mail.');
      return false;
    }
    return true;
  };

  const validatePhone = () => {
    if (!form.phone.trim()) {
      setFormError('Укажите телефон.');
      return false;
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      setFormError('Укажите корректный телефон.');
      return false;
    }
    return true;
  };

  const handleNextFromStep1 = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleSendEmailVerification = async () => {
    if (!validateEmail()) {
      return;
    }

    // Проверка наличия env переменных
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setFormError('Ошибка конфигурации. Обратитесь к администратору.');
      console.error('Missing Supabase env');
      return;
    }

    if (!supabase) {
      setFormError('Ошибка инициализации. Обновите страницу.');
      return;
    }

    setIsSendingEmail(true);
    setFormError(null);

    const redirectTo =
      `${
        process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dev.wellifyglobal.com'
      }/auth/email-confirmed`;

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: baseData.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          firstName: baseData.firstName,
          lastName: baseData.lastName,
          middleName: baseData.middleName,
          birthDate: baseData.birthDate,
          role: 'director',
        },
      },
    });

    setIsSendingEmail(false);

    if (error) {
      setFormError(error.message || 'Не удалось отправить письмо');
      return;
    }

    // Успешная отправка письма
    setEmailSent(true);
    setEmailVerified(false);
  };

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!validatePhone()) {
      return;
    }

    if (!emailVerified) {
      setFormError('Подтвердите e-mail перед завершением регистрации.');
      return;
    }

    if (!supabase) {
      setFormError('Ошибка инициализации. Обновите страницу.');
      return;
    }

    setIsLoading(true);

    try {
      // Получаем текущего пользователя
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setIsLoading(false);
        setFormError(
          'Пользователь не авторизован. Пожалуйста, войдите в систему.',
        );
        return;
      }

      const fullName = [baseData.lastName, baseData.firstName, baseData.middleName]
        .filter(Boolean)
        .join(' ');

      // Обновляем профиль: ФИО, телефон, роль, email_verified и при необходимости дату рождения
      const profileUpdate: Record<string, any> = {
        first_name: baseData.firstName.trim(),
        last_name: baseData.lastName.trim(),
        middle_name: baseData.middleName.trim() || null,
        full_name: fullName || null,
        phone: form.phone.trim(),
        role: 'директор',
        email_verified: true,
      };

      // Если в таблице есть колонка с русским названием даты рождения
      profileUpdate['дата_рождения'] = baseData.birthDate || null;

      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id);

      setIsLoading(false);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setFormError(updateError.message || 'Ошибка при сохранении профиля');
        return;
      }

      // Редирект в дашборд директора
      router.push('/dashboard/director');
    } catch (error) {
      console.error('Error updating profile:', error);
      setIsLoading(false);
      setFormError(
        'Произошла ошибка при сохранении данных. Попробуйте ещё раз.',
      );
    }
  };

  const steps = [
    { id: 1, label: 'Основные данные' },
    { id: 2, label: 'E-mail' },
    { id: 3, label: 'Телефон' },
  ];

  const renderStepHeader = () => (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-4">
        {steps.map((s) => (
          <div key={s.id} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-all ${
                step >= s.id ? 'bg-primary' : 'bg-zinc-800'
              }`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-zinc-400">
        {steps.map((s) => (
          <div key={s.id} className="flex-1 text-center">
            {s.label}
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-xs text-zinc-500">
        Шаг {step} из 3
      </div>
    </div>
  );

  const renderAlerts = () => {
    if (!formError && !formSuccess) {
      // Резервируем место для алертов, чтобы карточка не прыгала
      return <div className="min-h-[44px]" />;
    }

    return (
      <div className="min-h-[44px] space-y-2">
        {formError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        {formSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}
      </div>
    );
  };

  const renderStep1 = () => (
    <form onSubmit={handleNextFromStep1} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Имя <span className="text-destructive">*</span>
          </label>
          <input
            value={baseData.firstName}
            onChange={(e) =>
              setBaseData((prev) => ({ ...prev, firstName: e.target.value }))
            }
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="Иван"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Фамилия <span className="text-destructive">*</span>
          </label>
          <input
            value={baseData.lastName}
            onChange={(e) =>
              setBaseData((prev) => ({ ...prev, lastName: e.target.value }))
            }
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="Иванов"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Отчество</label>
          <input
            value={baseData.middleName}
            onChange={(e) =>
              setBaseData((prev) => ({ ...prev, middleName: e.target.value }))
            }
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="Иванович"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Дата рождения <span className="text-destructive">*</span>
        </label>
        <input
          type="date"
          value={baseData.birthDate}
          onChange={(e) =>
            setBaseData((prev) => ({ ...prev, birthDate: e.target.value }))
          }
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Формат: ДД.ММ.ГГГГ
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Пароль <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={baseData.password}
              onChange={(e) =>
                setBaseData((prev) => ({ ...prev, password: e.target.value }))
              }
              className="h-11 w-full rounded-lg border border-border bg-card px-4 pr-10 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
              placeholder="Минимум 8 символов"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Подтвердите пароль <span className="text-destructive">*</span>
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="Повторите пароль"
          />
        </div>
      </div>

      {renderAlerts()}

      <div className="flex justify-end">
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? 'Загрузка...' : 'Дальше'}
        </Button>
      </div>
    </form>
  );

  const renderStep2 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid =
      form.email.trim() && emailRegex.test(form.email.trim());

    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            E-mail <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="you@example.com"
          />
        </div>

        {emailSent && !emailVerified && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Письмо с подтверждением отправлено на {form.email.trim()}. Перейдите
            по ссылке в письме.
          </div>
        )}
        {emailSent && emailVerified && (
          <div className="mt-4 rounded-xl border border-emerald-500/60 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
            Поздравляем! Ваша почта подтверждена, можете переходить к
            следующему шагу.
          </div>
        )}

        {renderAlerts()}

        <div className="mt-4 flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full md:w-auto"
            disabled={isSendingEmail}
            onClick={() => setStep(1)}
          >
            Назад
          </Button>

          {!emailSent ? (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={!form.email.trim() || isSendingEmail || !isEmailValid}
              onClick={handleSendEmailVerification}
            >
              {isSendingEmail ? 'Отправляем...' : 'Подтвердить e-mail'}
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={!emailVerified}
              onClick={() => setStep(3)}
            >
              Далее
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <form onSubmit={handleFinish} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Телефон <span className="text-destructive">*</span>
        </label>
        <input
          value={form.phone}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, phone: e.target.value }))
          }
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
          placeholder="+38 (0XX) XXX-XX-XX"
        />
      </div>

      {renderAlerts()}

      <div className="mt-4 flex flex-col gap-2 md:flex-row md:justify-between">
        <Button
          type="button"
          variant="outline"
          className="w-full md:w-auto"
          disabled={isLoading}
          onClick={() => setStep(2)}
        >
          Назад
        </Button>
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? 'Завершаем...' : 'Завершить регистрацию'}
        </Button>
      </div>
    </form>
  );

  return (
    <main className="mt-[72px] flex min-h-[calc(100vh-72px)] items-center justify-center px-4">
      <Card className="w-full max-w-xl border border-white/5 bg-[radial-gradient(circle_at_top,_rgba(62,132,255,0.18),_transparent_55%),_rgba(7,13,23,0.96)] shadow-[0_18px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <CardHeader className="pb-4">
          {renderStepHeader()}
          <CardTitle className="text-center text-xl font-semibold">
            Создать аккаунт директора
          </CardTitle>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              Войти
            </Link>
          </p>
        </CardHeader>
        <CardContent>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </CardContent>
      </Card>
    </main>
  );
}

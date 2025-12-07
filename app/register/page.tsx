'use client';

import { FormEvent, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

type Step = 1 | 2 | 3;
type EmailStatus = 'idle' | 'sent' | 'confirmed';

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
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [emailInfo, setEmailInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

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
  }, [step]);

  // Поллинг для проверки подтверждения email
  useEffect(() => {
    if (!isCheckingEmail || !supabase) return;

    let intervalId: number | undefined;

    const checkEmail = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // если пользователь уже авторизован и email подтверждён
        if (user && (user.email_confirmed_at || user.confirmed_at)) {
          setEmailStatus('confirmed');
          setIsCheckingEmail(false);

          if (intervalId) {
            window.clearInterval(intervalId);
          }
        }
      } catch (error) {
        console.error('Error checking email confirmation:', error);
      }
    };

    // первая проверка сразу
    checkEmail().catch(console.error);

    // и затем периодический поллинг раз в 3 секунды
    intervalId = window.setInterval(() => {
      checkEmail().catch(console.error);
    }, 3000);

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isCheckingEmail, supabase]);

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

  const handleSendEmail = async () => {
    if (!validateEmail()) return;

    // Проверка наличия env переменных
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setFormError('Ошибка конфигурации. Обратитесь к администратору.');
      console.error('Missing Supabase env');
      return;
    }

    if (!supabase) {
      setFormError('Ошибка инициализации. Обновите страницу.');
      return;
    }

    setIsLoading(true);
    setFormError(null);
    setEmailInfo(null);

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const emailRedirectTo = `${SITE_URL}/auth/email-confirmed`;

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: baseData.password,
      options: {
        emailRedirectTo,
        data: {
          firstName: baseData.firstName,
          lastName: baseData.lastName,
          middleName: baseData.middleName,
          birthDate: baseData.birthDate,
          role: 'director',
        },
      },
    });

    setIsLoading(false);

    if (error) {
      setFormError(error.message || 'Не удалось отправить письмо');
      return;
    }

    // Сохраняем userId для отслеживания создания профиля
    if (data.user?.id) {
      setUserId(data.user.id);
    }

    // Если signUp прошёл без ошибок - письмо отправлено Supabase
    setEmailStatus('sent');
    setEmailInfo(`Письмо с подтверждением отправлено на ${form.email.trim()}. Перейдите по ссылке в письме.`);
    
    // Начинаем проверку статуса подтверждения
    setIsCheckingEmail(true);
  };

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!validatePhone()) {
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
        setFormError('Пользователь не авторизован. Пожалуйста, войдите в систему.');
        return;
      }

      // Обновляем телефон в профиле
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone: form.phone.trim() })
        .eq('id', user.id);

      setIsLoading(false);

      if (updateError) {
        console.error('Error updating phone:', updateError);
        setFormError(updateError.message || 'Ошибка при сохранении телефона');
        return;
      }

      // Редирект в дашборд директора
      router.push('/dashboard/director');
    } catch (error) {
      console.error('Error updating phone:', error);
      setIsLoading(false);
      setFormError('Произошла ошибка при сохранении телефона. Попробуйте ещё раз.');
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
        {steps.map(s => (
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
        {steps.map(s => (
          <div key={s.id} className="flex-1 text-center">
            {s.label}
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-xs text-zinc-500">Шаг {step} из 3</div>
    </div>
  );

  const renderAlerts = () => {
    if (!formError && !formSuccess) {
      // Резервируем место для алертов, чтобы карточка не прыгала
      return <div className="min-h-[44px]" />;
    }

    return (
      <div className="space-y-2 min-h-[44px]">
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
            onChange={(e) => setBaseData(prev => ({ ...prev, firstName: e.target.value }))}
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
            onChange={(e) => setBaseData(prev => ({ ...prev, lastName: e.target.value }))}
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="Иванов"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Отчество</label>
          <input
            value={baseData.middleName}
            onChange={(e) => setBaseData(prev => ({ ...prev, middleName: e.target.value }))}
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
          onChange={(e) => setBaseData(prev => ({ ...prev, birthDate: e.target.value }))}
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
        />
        <p className="mt-1 text-xs text-muted-foreground">Формат: ДД.ММ.ГГГГ</p>
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
              onChange={(e) => setBaseData(prev => ({ ...prev, password: e.target.value }))}
              className="h-11 w-full rounded-lg border border-border bg-card px-4 pr-10 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
              placeholder="Минимум 8 символов"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          E-mail <span className="text-destructive">*</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
          placeholder="you@example.com"
        />
      </div>

      {emailStatus === 'confirmed' ? (
        <div className="mt-4 rounded-xl border border-emerald-500/60 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
          Поздравляем! Ваша почта подтверждена, можете переходить к следующему шагу.
        </div>
      ) : emailStatus === 'sent' ? (
        <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Письмо с подтверждением отправлено на {form.email.trim()}. Перейдите по ссылке в письме.
        </div>
      ) : null}

      {renderAlerts()}

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full md:w-auto"
            disabled={isLoading}
            onClick={() => setStep(1)}
          >
            Назад
          </Button>
          {emailStatus === 'sent' && (
            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
              disabled={isLoading}
              onClick={handleSendEmail}
            >
              {isLoading ? 'Отправляем...' : 'Отправить ещё раз'}
            </Button>
          )}
          {emailStatus === 'idle' && (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={isLoading}
              onClick={handleSendEmail}
            >
              {isLoading ? 'Отправляем...' : 'Далее'}
            </Button>
          )}
        </div>

        {emailStatus === 'confirmed' && (
          <Button
            type="button"
            className="w-full md:w-auto"
            disabled={isLoading}
            onClick={async () => {
              setIsLoading(true);
              try {
                const { createDirectorProfile } = await import('@/app/auth/register/actions');
                const result = await createDirectorProfile({
                  firstName: baseData.firstName,
                  lastName: baseData.lastName,
                  middleName: baseData.middleName || undefined,
                  birthDate: baseData.birthDate,
                  email: form.email.trim(),
                });

                setIsLoading(false);

                if (!result.success) {
                  setFormError(result.error || 'Ошибка при создании профиля');
                  return;
                }

                setStep(3);
              } catch (error) {
                console.error('Error creating profile:', error);
                setIsLoading(false);
                setFormError('Произошла ошибка при создании профиля. Попробуйте ещё раз.');
              }
            }}
          >
            {isLoading ? 'Создаём профиль...' : 'Дальше'}
          </Button>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <form onSubmit={handleFinish} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Телефон <span className="text-destructive">*</span>
        </label>
        <input
          value={form.phone}
          onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
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
    <main className="flex mt-[72px] min-h-[calc(100vh-72px)] items-center justify-center px-4">
      <Card className="w-full max-w-xl border border-white/5 bg-[radial-gradient(circle_at_top,_rgba(62,132,255,0.18),_transparent_55%),_rgba(7,13,23,0.96)] shadow-[0_18px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <CardHeader className="pb-4">
          {renderStepHeader()}
          <CardTitle className="text-xl font-semibold text-center">Создать аккаунт директора</CardTitle>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
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

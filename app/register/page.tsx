'use client';

import { FormEvent, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { createDirectorProfile } from '@/app/auth/register/actions';

type Step = 1 | 2 | 3;
type EmailStatus = 'idle' | 'sent' | 'confirmed';

interface FormState {
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  password: string;
  passwordConfirm: string;
  email: string;
  phone: string;
}

export default function RegisterDirectorPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    middleName: '',
    birthDate: '',
    password: '',
    passwordConfirm: '',
    email: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [wasSubmittedStep3, setWasSubmittedStep3] = useState(false);

  const supabase = createBrowserSupabaseClient();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Автоопределение подтверждения email на шаге 2
  useEffect(() => {
    if (step !== 2 || emailStatus !== 'sent') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const checkEmailConfirmation = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user?.email_confirmed_at) {
        setEmailStatus('confirmed');
        setFormSuccess('E-mail подтверждён. Можно переходить к следующему шагу.');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };

    // Проверяем сразу при монтировании
    checkEmailConfirmation();

    // Затем каждые 5 секунд
    pollIntervalRef.current = setInterval(checkEmailConfirmation, 5000);

    // Также проверяем при возврате на вкладку
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkEmailConfirmation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [step, emailStatus, supabase]);

  // Сбрасываем ошибки при смене шага
  useEffect(() => {
    setFormError(null);
    setFormSuccess(null);
    if (step !== 3) {
      setWasSubmittedStep3(false);
    }
  }, [step]);

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

  const validateStep1 = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError('Укажите имя и фамилию.');
      return false;
    }
    if (!form.birthDate.trim()) {
      setFormError('Укажите дату рождения.');
      return false;
    }
    if (!form.password || form.password.length < 8) {
      setFormError('Пароль должен содержать минимум 8 символов.');
      return false;
    }
    if (form.password !== form.passwordConfirm) {
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
      if (wasSubmittedStep3) {
        setFormError('Укажите телефон.');
      }
      return false;
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      if (wasSubmittedStep3) {
        setFormError('Укажите корректный телефон.');
      }
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

  const handleSendEmail = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!validateEmail()) return;

    setIsLoading(true);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/confirm`,
        data: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          middle_name: form.middleName.trim() || null,
          birth_date: form.birthDate.trim(),
        },
      },
    });

    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        setFormError('Аккаунт с таким e-mail уже существует. Попробуйте войти.');
      } else {
        setFormError('Не удалось отправить письмо. Попробуйте ещё раз.');
      }
      return;
    }

    setEmailSent(true);
    setEmailStatus('sent');
    setFormSuccess(
      `Письмо с подтверждением отправлено на ${form.email.trim()}. Перейдите по ссылке в письме.`,
    );
  };

  const handleResendEmail = async () => {
    setFormError(null);
    setFormSuccess(null);

    if (!validateEmail()) return;

    setIsLoading(true);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: form.email.trim(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/confirm`,
      },
    });

    setIsLoading(false);

    if (error) {
      setFormError('Не удалось отправить письмо. Попробуйте ещё раз.');
      return;
    }

    setFormSuccess('Письмо отправлено повторно. Проверьте вашу почту.');
  };

  const handleNextFromStep2 = () => {
    if (emailStatus !== 'confirmed') {
      setFormError('Сначала подтвердите e-mail.');
      return;
    }
    setStep(3);
  };

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setWasSubmittedStep3(true);

    if (!validatePhone()) {
      return;
    }

    if (emailStatus !== 'confirmed') {
      setFormError('Сначала подтвердите e-mail. Вернитесь на шаг 2 и дождитесь подтверждения.');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('email', form.email.trim());
    formData.append('first_name', form.firstName.trim());
    formData.append('last_name', form.lastName.trim());
    formData.append('middle_name', form.middleName.trim() || '');
    formData.append('birth_date', form.birthDate.trim());
    formData.append('phone', form.phone.trim());

    const result = await createDirectorProfile(formData);

    setIsLoading(false);

    if (!result.success) {
      setFormError(result.error || 'Не удалось сохранить профиль. Попробуйте ещё раз.');
      return;
    }

    router.push('/dashboard/director');
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Имя <span className="text-destructive">*</span>
          </label>
          <input
            value={form.firstName}
            onChange={handleChange('firstName')}
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="Иван"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Фамилия <span className="text-destructive">*</span>
          </label>
          <input
            value={form.lastName}
            onChange={handleChange('lastName')}
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="Иванов"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Отчество</label>
        <input
          value={form.middleName}
          onChange={handleChange('middleName')}
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
          placeholder="Иванович"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Дата рождения <span className="text-destructive">*</span>
        </label>
        <input
          type="date"
          value={form.birthDate}
          onChange={handleChange('birthDate')}
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
              value={form.password}
              onChange={handleChange('password')}
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
          <div className="relative">
            <input
              type={showPasswordConfirm ? 'text' : 'password'}
              value={form.passwordConfirm}
              onChange={handleChange('passwordConfirm')}
              className="h-11 w-full rounded-lg border border-border bg-card px-4 pr-10 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
              placeholder="Повторите пароль"
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {renderAlerts()}

      <div className="mt-4 flex justify-end">
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? 'Загрузка...' : 'Дальше'}
        </Button>
      </div>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleSendEmail} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          E-mail <span className="text-destructive">*</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={handleChange('email')}
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
          placeholder="you@example.com"
        />
      </div>

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
          {!emailSent ? (
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={isLoading}
            >
              {isLoading ? 'Отправляем...' : 'Отправить письмо'}
            </Button>
          ) : emailStatus === 'sent' ? (
            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
              disabled={isLoading}
              onClick={handleResendEmail}
            >
              {isLoading ? 'Отправляем...' : 'Отправить ещё раз'}
            </Button>
          ) : null}
        </div>

        {emailStatus === 'confirmed' && (
          <Button
            type="button"
            className="w-full md:w-auto"
            disabled={isLoading}
            onClick={handleNextFromStep2}
          >
            Дальше
          </Button>
        )}
      </div>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={handleFinish} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Телефон <span className="text-destructive">*</span>
        </label>
        <input
          value={form.phone}
          onChange={handleChange('phone')}
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
          <CardTitle className="text-center text-2xl font-semibold">Создать аккаунт</CardTitle>
          <CardDescription className="mt-1 text-center text-sm">
            Заполните форму для регистрации директора
          </CardDescription>
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

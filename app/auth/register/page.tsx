'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type Step = 1 | 2 | 3;

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
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  // сбрасываем текст ошибок при смене шага
  useEffect(() => {
    setFormError(null);
    setFormSuccess(null);
  }, [step]);

  const supabase = createBrowserSupabaseClient();

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

  const handleSendEmail = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!validateEmail()) return;

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
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
      if ((error as any).code === 'user_already_exists') {
        setFormError('Аккаунт с таким e-mail уже существует. Попробуйте войти.');
      } else {
        setFormError('Не удалось отправить письмо. Попробуйте ещё раз.');
      }
      return;
    }

    setEmailSent(true);
    setFormSuccess(
      `Письмо с подтверждением отправлено на ${form.email.trim()}. Перейдите по ссылке в письме, затем вернитесь и нажмите кнопку «Я подтвердил e-mail».`,
    );
  };

  const handleCheckEmailConfirmed = async () => {
    setFormError(null);
    setFormSuccess(null);
    setIsLoading(true);

    const { data, error } = await supabase.auth.getUser();

    setIsLoading(false);

    if (error || !data.user) {
      setFormError('Не удалось получить данные пользователя. Обновите страницу и попробуйте ещё раз.');
      return;
    }

    if (!data.user.email || data.user.email.toLowerCase() !== form.email.trim().toLowerCase()) {
      setFormError('Подтверждённый e-mail не совпадает с указанным при регистрации.');
      return;
    }

    if (!data.user.email_confirmed_at) {
      setFormError('Мы не видим подтверждение e-mail. Убедитесь, что вы перешли по ссылке в письме.');
      return;
    }

    setEmailConfirmed(true);
    setFormSuccess('E-mail подтверждён. Можно переходить к следующему шагу.');
    setStep(3);
  };

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!validatePhone()) return;

    setIsLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setIsLoading(false);
      setFormError('Не найдена активная сессия. Убедитесь, что вы подтвердили e-mail.');
      return;
    }

    const userId = userData.user.id;
    const email = userData.user.email ?? form.email.trim();

    // создаём/обновляем профиль
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          uuid: userId,
          email,
          имя: form.firstName.trim(),
          фамилия: form.lastName.trim(),
          отчество: form.middleName.trim() || null,
          дата_рождения: form.birthDate.trim(),
          телефон: form.phone.trim(),
        },
        { onConflict: 'uuid' },
      );

    setIsLoading(false);

    if (profileError) {
      setFormError('Не удалось сохранить профиль. Попробуйте ещё раз.');
      return;
    }

    // успешное завершение – отправляем на дашборд директора
    router.push('/dashboard/director');
  };

  const renderStepHeader = () => {
    const steps = [
      { id: 1, label: 'Основные данные' },
      { id: 2, label: 'E-mail' },
      { id: 3, label: 'Телефон' },
    ];

    return (
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
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
  };

  const renderErrorsAndSuccess = () => (
    <div className="space-y-2">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Дата рождения <span className="text-destructive">*</span>
          </label>
          <input
            value={form.birthDate}
            onChange={handleChange('birthDate')}
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="ДД.ММ.ГГГГ"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Пароль <span className="text-destructive">*</span>
          </label>
          <input
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="Минимум 8 символов"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Подтвердите пароль <span className="text-destructive">*</span>
          </label>
          <input
            type="password"
            value={form.passwordConfirm}
            onChange={handleChange('passwordConfirm')}
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="Повторите пароль"
          />
        </div>
      </div>

      {renderErrorsAndSuccess()}

      <div className="mt-4 flex justify-end gap-2">
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

      {renderErrorsAndSuccess()}

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
          <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
            {isLoading ? 'Отправляем...' : emailSent ? 'Отправить ещё раз' : 'Отправить письмо'}
          </Button>
        </div>

        {emailSent && (
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-center text-xs text-zinc-300 underline md:w-auto"
            disabled={isLoading}
            onClick={handleCheckEmailConfirmed}
          >
            Я подтвердил e-mail
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

      {renderErrorsAndSuccess()}

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
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
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

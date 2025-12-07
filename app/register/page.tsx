'use client';

import { FormEvent, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

type Step = 1 | 2 | 3;
type EmailStatus = 'idle' | 'sent';

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

    const emailRedirectTo = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`
      : undefined;

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: baseData.password,
      options: {
        emailRedirectTo,
      },
    });

    setIsLoading(false);

    if (error) {
      setFormError(error.message || 'Не удалось отправить письмо');
      return;
    }

    // Если signUp прошёл без ошибок - письмо отправлено Supabase
    setEmailStatus('sent');
    setEmailInfo(`Письмо с подтверждением отправлено на ${form.email.trim()}. Перейдите по ссылке в письме.`);
  };

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!validatePhone()) {
      return;
    }

    // Пока просто показываем сообщение и логируем данные
    setFormSuccess('Регистрация завершена. Войдите в систему.');
    
    // Временный console.log с данными (без авторизации)
    console.log('Registration data:', {
      ...baseData,
      email: form.email.trim(),
      phone: form.phone.trim(),
    });

    // TODO: Здесь будет создание директорского профиля в таблицах
    // Пока не трогаем, чтобы не ломать email-поток
  };

  const steps = [
    { id: 1, label: 'Основные данные' },
    { id: 2, label: 'E-mail' },
    { id: 3, label: 'Телефон' },
  ];

  const renderStepHeader = () => (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-4">
        {steps.map(s => (
          <div key={s.id} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-all ${
                step >= s.id ? 'bg-blue-600' : 'bg-zinc-800'
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
      <p className="mt-2 text-center text-[11px] uppercase tracking-[0.16em] text-zinc-500">Шаг {step} из 3</p>
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
          <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        {formSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}
      </div>
    );
  };

  const renderStep1 = () => (
    <form onSubmit={handleNextFromStep1} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-400">
            Имя <span className="text-red-400">*</span>
          </span>
          <input
            value={baseData.firstName}
            onChange={(e) => setBaseData(prev => ({ ...prev, firstName: e.target.value }))}
            className="h-11 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none ring-0 focus:border-blue-500/80 focus:bg-zinc-900/80"
            placeholder="Иван"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-400">
            Фамилия <span className="text-red-400">*</span>
          </span>
          <input
            value={baseData.lastName}
            onChange={(e) => setBaseData(prev => ({ ...prev, lastName: e.target.value }))}
            className="h-11 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none ring-0 focus:border-blue-500/80 focus:bg-zinc-900/80"
            placeholder="Иванов"
          />
        </label>
      </div>

      <div className="space-y-1">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-400">Отчество</span>
          <input
            value={baseData.middleName}
            onChange={(e) => setBaseData(prev => ({ ...prev, middleName: e.target.value }))}
            className="h-11 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none ring-0 focus:border-blue-500/80 focus:bg-zinc-900/80"
            placeholder="Иванович"
          />
        </label>
      </div>

      <div className="space-y-1">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-400">
            Дата рождения <span className="text-red-400">*</span>
          </span>
          <input
            type="date"
            value={baseData.birthDate}
            onChange={(e) => setBaseData(prev => ({ ...prev, birthDate: e.target.value }))}
            className="h-11 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-3 text-sm text-zinc-50 outline-none ring-0 focus:border-blue-500/80 focus:bg-zinc-900/80 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
          />
        </label>
        <p className="text-[11px] text-zinc-500">Формат: ДД.ММ.ГГГГ</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-400">
            Пароль <span className="text-red-400">*</span>
          </span>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={baseData.password}
              onChange={(e) => setBaseData(prev => ({ ...prev, password: e.target.value }))}
              className="h-11 w-full rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-3 pr-10 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none focus:border-blue-500/80 focus:bg-zinc-900/80"
              placeholder="Минимум 8 символов"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-2.5 flex items-center text-zinc-500 hover:text-zinc-300 transition"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-400">
            Подтвердите пароль <span className="text-red-400">*</span>
          </span>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="h-11 w-full rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-3 pr-10 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none focus:border-blue-500/80 focus:bg-zinc-900/80"
              placeholder="Повторите пароль"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-2.5 flex items-center text-zinc-500 hover:text-zinc-300 transition"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
      </div>

      {renderAlerts()}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Загрузка...' : 'Дальше'}
        </button>
      </div>
    </form>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-400">
          E-mail <span className="text-red-400">*</span>
        </span>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
          className="h-11 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none ring-0 focus:border-blue-500/80 focus:bg-zinc-900/80"
          placeholder="you@example.com"
        />
      </label>

      {emailStatus === 'sent' && emailInfo && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          {emailInfo}
        </div>
      )}

      {renderAlerts()}

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800/60 transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading}
            onClick={() => setStep(1)}
          >
            Назад
          </button>
          {emailStatus === 'sent' && (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800/60 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
              onClick={handleSendEmail}
            >
              {isLoading ? 'Отправляем...' : 'Отправить ещё раз'}
            </button>
          )}
          {emailStatus === 'idle' && (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
              onClick={handleSendEmail}
            >
              {isLoading ? 'Отправляем...' : 'Далее'}
            </button>
          )}
        </div>

        {emailStatus === 'sent' && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading}
            onClick={() => setStep(3)}
          >
            Дальше
          </button>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <form onSubmit={handleFinish} className="space-y-5">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-400">
          Телефон <span className="text-red-400">*</span>
        </span>
        <input
          value={form.phone}
          onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
          className="h-11 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none ring-0 focus:border-blue-500/80 focus:bg-zinc-900/80"
          placeholder="+38 (0XX) XXX-XX-XX"
        />
      </label>

      {renderAlerts()}

      <div className="mt-4 flex flex-col gap-2 md:flex-row md:justify-between">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800/60 transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading}
          onClick={() => setStep(2)}
        >
          Назад
        </button>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Завершаем...' : 'Завершить регистрацию'}
        </button>
      </div>
    </form>
  );

  return (
    <main className="min-h-[calc(100vh-88px)] flex items-center justify-center px-4 pb-10">
      <section className="w-full max-w-[520px] rounded-3xl border border-zinc-800/60 bg-zinc-900/85 shadow-[0_24px_80px_rgba(0,0,0,0.85)] px-8 py-8 md:px-10 md:py-9 space-y-6">
        <header className="space-y-2 text-center">
          {renderStepHeader()}
          <h1 className="text-[22px] font-semibold text-zinc-50">Создать аккаунт</h1>
          <p className="text-sm text-zinc-400">Заполните форму для регистрации директора</p>
          <p className="text-xs text-zinc-500">
            Уже есть аккаунт?{' '}
            <Link href="/auth/login" className="font-medium text-blue-400 hover:text-blue-300 hover:underline">
              Войти
            </Link>
          </p>
        </header>
        <div>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </section>
    </main>
  );
}

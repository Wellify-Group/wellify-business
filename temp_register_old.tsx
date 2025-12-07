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

  // ╨б╨╛╨╖╨┤╨░╨╡╨╝ ╨║╨╗╨╕╨╡╨╜╤В Supabase ╤З╨╡╤А╨╡╨╖ useMemo
  const supabase = useMemo<SupabaseClient | null>(() => {
    try {
      return createBrowserSupabaseClient();
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }, []);

  // ╨б╨▒╤А╨░╤Б╤Л╨▓╨░╨╡╨╝ ╨╛╤И╨╕╨▒╨║╨╕ ╨┐╤А╨╕ ╤Б╨╝╨╡╨╜╨╡ ╤И╨░╨│╨░
  useEffect(() => {
    setFormError(null);
    setFormSuccess(null);
  }, [step]);

  const validateStep1 = () => {
    if (!baseData.firstName.trim() || !baseData.lastName.trim()) {
      setFormError('╨г╨║╨░╨╢╨╕╤В╨╡ ╨╕╨╝╤П ╨╕ ╤Д╨░╨╝╨╕╨╗╨╕╤О.');
      return false;
    }
    if (!baseData.birthDate.trim()) {
      setFormError('╨г╨║╨░╨╢╨╕╤В╨╡ ╨┤╨░╤В╤Г ╤А╨╛╨╢╨┤╨╡╨╜╨╕╤П.');
      return false;
    }
    if (!baseData.password || baseData.password.length < 8) {
      setFormError('╨Я╨░╤А╨╛╨╗╤М ╨┤╨╛╨╗╨╢╨╡╨╜ ╤Б╨╛╨┤╨╡╤А╨╢╨░╤В╤М ╨╝╨╕╨╜╨╕╨╝╤Г╨╝ 8 ╤Б╨╕╨╝╨▓╨╛╨╗╨╛╨▓.');
      return false;
    }
    if (baseData.password !== passwordConfirm) {
      setFormError('╨Я╨░╤А╨╛╨╗╤М ╨╕ ╨┐╨╛╨┤╤В╨▓╨╡╤А╨╢╨┤╨╡╨╜╨╕╨╡ ╨┐╨░╤А╨╛╨╗╤П ╨╜╨╡ ╤Б╨╛╨▓╨┐╨░╨┤╨░╤О╤В.');
      return false;
    }
    return true;
  };

  const validateEmail = () => {
    if (!form.email.trim()) {
      setFormError('╨г╨║╨░╨╢╨╕╤В╨╡ e-mail.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setFormError('╨г╨║╨░╨╢╨╕╤В╨╡ ╨║╨╛╤А╤А╨╡╨║╤В╨╜╤Л╨╣ e-mail.');
      return false;
    }
    return true;
  };

  const validatePhone = () => {
    if (!form.phone.trim()) {
      setFormError('╨г╨║╨░╨╢╨╕╤В╨╡ ╤В╨╡╨╗╨╡╤Д╨╛╨╜.');
      return false;
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      setFormError('╨г╨║╨░╨╢╨╕╤В╨╡ ╨║╨╛╤А╤А╨╡╨║╤В╨╜╤Л╨╣ ╤В╨╡╨╗╨╡╤Д╨╛╨╜.');
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

    // ╨Я╤А╨╛╨▓╨╡╤А╨║╨░ ╨╜╨░╨╗╨╕╤З╨╕╤П env ╨┐╨╡╤А╨╡╨╝╨╡╨╜╨╜╤Л╤Е
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setFormError('╨Ю╤И╨╕╨▒╨║╨░ ╨║╨╛╨╜╤Д╨╕╨│╤Г╤А╨░╤Ж╨╕╨╕. ╨Ю╨▒╤А╨░╤В╨╕╤В╨╡╤Б╤М ╨║ ╨░╨┤╨╝╨╕╨╜╨╕╤Б╤В╤А╨░╤В╨╛╤А╤Г.');
      console.error('Missing Supabase env');
      return;
    }

    if (!supabase) {
      setFormError('╨Ю╤И╨╕╨▒╨║╨░ ╨╕╨╜╨╕╤Ж╨╕╨░╨╗╨╕╨╖╨░╤Ж╨╕╨╕. ╨Ю╨▒╨╜╨╛╨▓╨╕╤В╨╡ ╤Б╤В╤А╨░╨╜╨╕╤Ж╤Г.');
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
      setFormError(error.message || '╨Э╨╡ ╤Г╨┤╨░╨╗╨╛╤Б╤М ╨╛╤В╨┐╤А╨░╨▓╨╕╤В╤М ╨┐╨╕╤Б╤М╨╝╨╛');
      return;
    }

    // ╨Х╤Б╨╗╨╕ signUp ╨┐╤А╨╛╤И╤С╨╗ ╨▒╨╡╨╖ ╨╛╤И╨╕╨▒╨╛╨║ - ╨┐╨╕╤Б╤М╨╝╨╛ ╨╛╤В╨┐╤А╨░╨▓╨╗╨╡╨╜╨╛ Supabase
    setEmailStatus('sent');
    setEmailInfo(`╨Я╨╕╤Б╤М╨╝╨╛ ╤Б ╨┐╨╛╨┤╤В╨▓╨╡╤А╨╢╨┤╨╡╨╜╨╕╨╡╨╝ ╨╛╤В╨┐╤А╨░╨▓╨╗╨╡╨╜╨╛ ╨╜╨░ ${form.email.trim()}. ╨Я╨╡╤А╨╡╨╣╨┤╨╕╤В╨╡ ╨┐╨╛ ╤Б╤Б╤Л╨╗╨║╨╡ ╨▓ ╨┐╨╕╤Б╤М╨╝╨╡.`);
  };

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!validatePhone()) {
      return;
    }

    // ╨Я╨╛╨║╨░ ╨┐╤А╨╛╤Б╤В╨╛ ╨┐╨╛╨║╨░╨╖╤Л╨▓╨░╨╡╨╝ ╤Б╨╛╨╛╨▒╤Й╨╡╨╜╨╕╨╡ ╨╕ ╨╗╨╛╨│╨╕╤А╤Г╨╡╨╝ ╨┤╨░╨╜╨╜╤Л╨╡
    setFormSuccess('╨а╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╤П ╨╖╨░╨▓╨╡╤А╤И╨╡╨╜╨░. ╨Т╨╛╨╣╨┤╨╕╤В╨╡ ╨▓ ╤Б╨╕╤Б╤В╨╡╨╝╤Г.');
    
    // ╨Т╤А╨╡╨╝╨╡╨╜╨╜╤Л╨╣ console.log ╤Б ╨┤╨░╨╜╨╜╤Л╨╝╨╕ (╨▒╨╡╨╖ ╨░╨▓╤В╨╛╤А╨╕╨╖╨░╤Ж╨╕╨╕)
    console.log('Registration data:', {
      ...baseData,
      email: form.email.trim(),
      phone: form.phone.trim(),
    });

    // TODO: ╨Ч╨┤╨╡╤Б╤М ╨▒╤Г╨┤╨╡╤В ╤Б╨╛╨╖╨┤╨░╨╜╨╕╨╡ ╨┤╨╕╤А╨╡╨║╤В╨╛╤А╤Б╨║╨╛╨│╨╛ ╨┐╤А╨╛╤Д╨╕╨╗╤П ╨▓ ╤В╨░╨▒╨╗╨╕╤Ж╨░╤Е
    // ╨Я╨╛╨║╨░ ╨╜╨╡ ╤В╤А╨╛╨│╨░╨╡╨╝, ╤З╤В╨╛╨▒╤Л ╨╜╨╡ ╨╗╨╛╨╝╨░╤В╤М email-╨┐╨╛╤В╨╛╨║
  };

  const steps = [
    { id: 1, label: '╨Ю╤Б╨╜╨╛╨▓╨╜╤Л╨╡ ╨┤╨░╨╜╨╜╤Л╨╡' },
    { id: 2, label: 'E-mail' },
    { id: 3, label: '╨в╨╡╨╗╨╡╤Д╨╛╨╜' },
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
      <div className="mt-2 text-center text-xs text-zinc-500">╨и╨░╨│ {step} ╨╕╨╖ 3</div>
    </div>
  );

  const renderAlerts = () => {
    if (!formError && !formSuccess) {
      // ╨а╨╡╨╖╨╡╤А╨▓╨╕╤А╤Г╨╡╨╝ ╨╝╨╡╤Б╤В╨╛ ╨┤╨╗╤П ╨░╨╗╨╡╤А╤В╨╛╨▓, ╤З╤В╨╛╨▒╤Л ╨║╨░╤А╤В╨╛╤З╨║╨░ ╨╜╨╡ ╨┐╤А╤Л╨│╨░╨╗╨░
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
            ╨Ш╨╝╤П <span className="text-destructive">*</span>
          </label>
          <input
            value={baseData.firstName}
            onChange={(e) => setBaseData(prev => ({ ...prev, firstName: e.target.value }))}
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="╨Ш╨▓╨░╨╜"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            ╨д╨░╨╝╨╕╨╗╨╕╤П <span className="text-destructive">*</span>
          </label>
          <input
            value={baseData.lastName}
            onChange={(e) => setBaseData(prev => ({ ...prev, lastName: e.target.value }))}
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="╨Ш╨▓╨░╨╜╨╛╨▓"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">╨Ю╤В╤З╨╡╤Б╤В╨▓╨╛</label>
        <input
          value={baseData.middleName}
          onChange={(e) => setBaseData(prev => ({ ...prev, middleName: e.target.value }))}
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
          placeholder="╨Ш╨▓╨░╨╜╨╛╨▓╨╕╤З"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          ╨Ф╨░╤В╨░ ╤А╨╛╨╢╨┤╨╡╨╜╨╕╤П <span className="text-destructive">*</span>
        </label>
        <input
          type="date"
          value={baseData.birthDate}
          onChange={(e) => setBaseData(prev => ({ ...prev, birthDate: e.target.value }))}
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
        />
        <p className="mt-1 text-xs text-muted-foreground">╨д╨╛╤А╨╝╨░╤В: ╨Ф╨Ф.╨Ь╨Ь.╨У╨У╨У╨У</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            ╨Я╨░╤А╨╛╨╗╤М <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={baseData.password}
              onChange={(e) => setBaseData(prev => ({ ...prev, password: e.target.value }))}
              className="h-11 w-full rounded-lg border border-border bg-card px-4 pr-10 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
              placeholder="╨Ь╨╕╨╜╨╕╨╝╤Г╨╝ 8 ╤Б╨╕╨╝╨▓╨╛╨╗╨╛╨▓"
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
            ╨Я╨╛╨┤╤В╨▓╨╡╤А╨┤╨╕╤В╨╡ ╨┐╨░╤А╨╛╨╗╤М <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-card px-4 pr-10 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
              placeholder="╨Я╨╛╨▓╤В╨╛╤А╨╕╤В╨╡ ╨┐╨░╤А╨╛╨╗╤М"
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
      </div>

      {renderAlerts()}

      <div className="mt-4 flex justify-end">
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? '╨Ч╨░╨│╤А╤Г╨╖╨║╨░...' : '╨Ф╨░╨╗╤М╤И╨╡'}
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

      {emailStatus === 'sent' && emailInfo && (
        <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          {emailInfo}
        </div>
      )}

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
            ╨Э╨░╨╖╨░╨┤
          </Button>
          {emailStatus === 'sent' && (
            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
              disabled={isLoading}
              onClick={handleSendEmail}
            >
              {isLoading ? '╨Ю╤В╨┐╤А╨░╨▓╨╗╤П╨╡╨╝...' : '╨Ю╤В╨┐╤А╨░╨▓╨╕╤В╤М ╨╡╤Й╤С ╤А╨░╨╖'}
            </Button>
          )}
          {emailStatus === 'idle' && (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={isLoading}
              onClick={handleSendEmail}
            >
              {isLoading ? '╨Ю╤В╨┐╤А╨░╨▓╨╗╤П╨╡╨╝...' : '╨Ф╨░╨╗╨╡╨╡'}
            </Button>
          )}
        </div>

        {emailStatus === 'sent' && (
          <Button
            type="button"
            className="w-full md:w-auto"
            disabled={isLoading}
            onClick={() => setStep(3)}
          >
            ╨Ф╨░╨╗╤М╤И╨╡
          </Button>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <form onSubmit={handleFinish} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          ╨в╨╡╨╗╨╡╤Д╨╛╨╜ <span className="text-destructive">*</span>
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
          ╨Э╨░╨╖╨░╨┤
        </Button>
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? '╨Ч╨░╨▓╨╡╤А╤И╨░╨╡╨╝...' : '╨Ч╨░╨▓╨╡╤А╤И╨╕╤В╤М ╤А╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╤О'}
        </Button>
      </div>
    </form>
  );

  return (
    <main className="flex mt-[72px] min-h-[calc(100vh-72px)] items-center justify-center px-4">
      <Card className="w-full max-w-xl border border-white/5 bg-[radial-gradient(circle_at_top,_rgba(62,132,255,0.18),_transparent_55%),_rgba(7,13,23,0.96)] shadow-[0_18px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <CardHeader className="pb-4">
          {renderStepHeader()}
          <CardTitle className="text-center text-2xl font-semibold">╨б╨╛╨╖╨┤╨░╤В╤М ╨░╨║╨║╨░╤Г╨╜╤В</CardTitle>
          <CardDescription className="mt-1 text-center text-sm">
            ╨Ч╨░╨┐╨╛╨╗╨╜╨╕╤В╨╡ ╤Д╨╛╤А╨╝╤Г ╨┤╨╗╤П ╤А╨╡╨│╨╕╤Б╤В╤А╨░╤Ж╨╕╨╕ ╨┤╨╕╤А╨╡╨║╤В╨╛╤А╨░
          </CardDescription>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            ╨г╨╢╨╡ ╨╡╤Б╤В╤М ╨░╨║╨║╨░╤Г╨╜╤В?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              ╨Т╨╛╨╣╤В╨╕
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

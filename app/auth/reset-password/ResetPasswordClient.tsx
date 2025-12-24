"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [supabase] = useState(() => createBrowserSupabaseClient());
  
  // Получаем email и code из query параметров
  const email = searchParams.get("email");
  const code = searchParams.get("code");
  
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);

  // Проверяем код при загрузке
  useEffect(() => {
    const verifyCode = async () => {
      if (!email || !code) {
        setIsVerifying(false);
        setIsValid(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-password-reset-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            code: code,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setIsValid(true);
        } else {
          setIsValid(false);
          setError(data.error || 'Неверный или истекший код');
        }
      } catch (error: any) {
        console.error('Verify code error:', error);
        setIsValid(false);
        setError('Ошибка при проверке кода');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyCode();
  }, [email, code]);

  // Показываем загрузку, пока проверяем код
  if (isVerifying) {
    return (
      <div className="w-full max-w-[640px] rounded-[32px] border border-border bg-card shadow-modal backdrop-blur-2xl px-10 py-10">
        <div className="text-center text-sm text-zinc-400">
          Проверка кода...
        </div>
      </div>
    );
  }

  // Если код недействителен
  if (!isValid || !email || !code) {
    return (
      <div className="w-full max-w-[640px] rounded-[32px] border border-border bg-card shadow-modal backdrop-blur-2xl px-10 py-10">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-rose-500/20 border-2 border-rose-500/30 p-4">
              <AlertCircle className="h-12 w-12 text-rose-400" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-zinc-50 mb-2">
            Недействительный код
          </h2>
          <p className="text-sm text-zinc-400 mb-4">
            {error || 'Код для сброса пароля недействителен или устарел. Запросите новый код.'}
          </p>
          <Link href="/forgot-password">
            <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-zinc-700/70 bg-zinc-900/80 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-600/70 transition-all">
              Запросить новый код
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Валидация
    if (!password || password.length < 8) {
      setError("Пароль должен содержать минимум 8 символов.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Пароли не совпадают.");
      return;
    }

    setIsLoading(true);

    try {
      // Используем API endpoint для сброса пароля
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password, code }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data.success) {
        setError(data?.error || data?.message || "Не удалось сбросить пароль. Попробуйте ещё раз.");
        setIsLoading(false);
        return;
      }

      setSuccess("Пароль успешно изменён. Теперь вы можете войти в систему.");
      
      // Через 2 секунды редиректим на страницу входа
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
      setIsLoading(false);
    } catch (err: any) {
      console.error("[reset-password] Error", err);
      setError(err?.message || "Ошибка при сбросе пароля.");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-[640px] rounded-[32px] border border-border bg-card shadow-modal backdrop-blur-2xl px-10 py-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 p-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-zinc-50 mb-2">
          Пароль успешно изменён!
        </h2>
        <p className="text-sm text-zinc-400 mb-4">
          Вы будете перенаправлены на страницу входа...
        </p>
        <Link href="/auth/login">
          <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent-primary,#2563eb)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors">
            Перейти к входу
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[640px] rounded-[32px] border border-border bg-card shadow-modal backdrop-blur-2xl px-10 py-10">
      <h1 className="mb-2 text-center text-[22px] font-semibold tracking-tight text-zinc-50">
        Сброс пароля
      </h1>
      <p className="mb-6 text-center text-sm text-zinc-400">
        Введите новый пароль для вашего аккаунта.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Новый пароль
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              required
              minLength={8}
              className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-4 pr-10 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
              placeholder="Минимум 8 символов"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
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

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Подтвердите пароль
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              setError(null);
            }}
            required
            minLength={8}
            className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-4 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
            placeholder="Повторите пароль"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-800/80 bg-rose-950/80 px-4 py-3 text-xs text-rose-50">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !password || !passwordConfirm}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent-primary,#2563eb)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Изменяем пароль...
            </>
          ) : (
            <>
              Изменить пароль
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/auth/login"
          className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          Вернуться к входу
        </Link>
      </div>
    </div>
  );
}


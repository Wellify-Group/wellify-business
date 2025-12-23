"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
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
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 shadow-[0_18px_45px_rgba(15,23,42,0.12)] px-8 py-10">
        <div className="text-center text-sm text-muted-foreground">
          Проверка кода...
        </div>
      </div>
    );
  }

  // Если код недействителен
  if (!isValid || !email || !code) {
    return (
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 shadow-[0_18px_45px_rgba(15,23,42,0.12)] px-8 py-10">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
              <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Недействительный код
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error || 'Код для сброса пароля недействителен или устарел. Запросите новый код.'}
          </p>
          <Link href="/forgot-password">
            <Button variant="outline" className="w-full">
              Запросить новый код
            </Button>
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
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 shadow-[0_18px_45px_rgba(15,23,42,0.12)] px-8 py-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Пароль успешно изменён!
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Вы будете перенаправлены на страницу входа...
        </p>
        <Link href="/auth/login">
          <Button className="w-full">Перейти к входу</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 shadow-[0_18px_45px_rgba(15,23,42,0.12)] px-8 py-10">
      <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-card-foreground">
        Сброс пароля
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Введите новый пароль для вашего аккаунта.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-card-foreground">
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
              className="h-12 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 pr-10 text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
              placeholder="Минимум 8 символов"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

        <div className="space-y-1">
          <label className="text-sm font-medium text-card-foreground">
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
            className="h-12 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
            placeholder="Повторите пароль"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !password || !passwordConfirm}
          className="w-full"
        >
          {isLoading ? "Изменяем пароль..." : "Изменить пароль"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/auth/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Вернуться к входу
        </Link>
      </div>
    </div>
  );
}


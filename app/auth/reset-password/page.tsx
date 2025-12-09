"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createBrowserSupabaseClient());
  
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Проверяем, есть ли токен сброса пароля в URL
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Если нет сессии, значит пользователь не перешёл по ссылке из письма
      if (!session) {
        setError("Недействительная или истёкшая ссылка. Запросите новую ссылку для сброса пароля.");
      }
    };

    checkSession();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Валидация
    if (!password || password.length < 8) {
      setError("Пароль должен содержать минимум 8 символов.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Пароль и подтверждение пароля не совпадают.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Обновляем пароль через Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("[reset-password] Update error", updateError);
        setError(updateError.message || "Не удалось изменить пароль. Попробуйте ещё раз.");
        return;
      }

      setIsSuccess(true);

      // Через 2 секунды редиректим на страницу входа
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      console.error("[reset-password] Unexpected error", err);
      setError("Произошла ошибка. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="flex mt-[72px] min-h-[calc(100vh-72px)] items-center justify-center px-4">
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
      </main>
    );
  }

  return (
    <main className="flex mt-[72px] min-h-[calc(100vh-72px)] items-center justify-center px-4">
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
                onChange={(e) => setPassword(e.target.value)}
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
              onChange={(e) => setPasswordConfirm(e.target.value)}
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
            disabled={isSubmitting || !password || !passwordConfirm}
            className="w-full"
          >
            {isSubmitting ? "Изменяем пароль..." : "Изменить пароль"}
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
    </main>
  );
}


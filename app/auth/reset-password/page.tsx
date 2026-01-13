"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Получаем токен и email из sessionStorage
    if (typeof window !== "undefined") {
      const storedToken = sessionStorage.getItem("password_reset_token");
      const storedEmail = sessionStorage.getItem("password_reset_email");
      
      if (!storedToken || !storedEmail) {
        // Если токена нет, перенаправляем на страницу восстановления пароля
        router.push("/forgot-password");
        return;
      }
      
      setToken(storedToken);
      setEmail(storedEmail);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Валидация
    if (!password || password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (!token) {
      setError("Токен не найден. Пожалуйста, начните процесс восстановления заново.");
      router.push("/forgot-password");
      return;
    }

    setIsSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      if (!API_URL) {
        setError("API URL не настроен");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при сбросе пароля. Попробуйте еще раз.");
        setIsSubmitting(false);
        return;
      }

      if (data.success) {
        setSuccess(true);
        // Очищаем sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("password_reset_token");
          sessionStorage.removeItem("password_reset_email");
        }
        
        // Через 2 секунды перенаправляем на страницу входа
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.error || "Ошибка при сбросе пароля");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      setError("Произошла ошибка. Попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="fixed top-[112px] left-0 right-0 bottom-0 flex items-center justify-center bg-background px-4 overflow-hidden">
        <div className="relative w-full max-w-[640px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Card className="relative z-10 w-full rounded-[32px] border border-border bg-card backdrop-blur-2xl px-10 py-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-green-500/20 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-semibold">Пароль успешно изменен!</h1>
                <p className="text-muted-foreground">
                  Вы будете перенаправлены на страницу входа...
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed top-[112px] left-0 right-0 bottom-0 flex items-center justify-center bg-background px-4 overflow-hidden">
      <div className="relative w-full max-w-[640px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Card className="relative z-10 w-full rounded-[32px] border border-border bg-card backdrop-blur-2xl px-10 py-10">
            {/* Back Button */}
            <Link
              href="/forgot-password"
              className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Link>

            <h1 className="mb-2 text-center text-[22px] font-semibold tracking-tight text-foreground">
              Сброс пароля
            </h1>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Введите новый пароль для {email || "вашего аккаунта"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Новый пароль
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="h-10 w-full rounded-2xl border border-border bg-background pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]"
                    placeholder="Минимум 6 символов"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
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
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    className="h-10 w-full rounded-2xl border border-border bg-background pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]"
                    placeholder="Повторите пароль"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !password || !confirmPassword}
                className="w-full h-10 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить новый пароль"
                )}
              </button>
            </form>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}

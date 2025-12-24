"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/language-provider";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
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
          const errorMessage = data.error === 'Invalid or expired code' 
            ? t<string>("register_error_code_invalid")
            : (data.error || t<string>("register_error_code_invalid"));
          setError(errorMessage);
        }
      } catch (error: any) {
        console.error('Verify code error:', error);
        setIsValid(false);
        setError(t<string>("register_error_code_verify_failed"));
      } finally {
        setIsVerifying(false);
      }
    };

    verifyCode();
  }, [email, code]);

  // Показываем загрузку, пока проверяем код
  if (isVerifying) {
    return (
      <div className="w-full rounded-[32px] border border-border bg-card backdrop-blur-2xl px-10 py-10">
        <div className="text-center text-sm text-muted-foreground">
          {t<string>("password_reset_verifying")}
        </div>
      </div>
    );
  }

  // Если код недействителен
  if (!isValid || !email || !code) {
    return (
      <div className="w-full rounded-[32px] border border-border bg-card backdrop-blur-2xl px-10 py-10">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/20 border-2 border-destructive/30 p-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t<string>("register_error_code_invalid")}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error || t<string>("register_error_code_invalid")}
          </p>
          <Link href="/forgot-password">
            <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all">
              {t<string>("password_reset_resend_code")}
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
      setError(t<string>("password_reset_error_min_length"));
      return;
    }

    if (password !== passwordConfirm) {
      setError(t<string>("password_reset_error_mismatch"));
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
        setError(data?.error || data?.message || t<string>("password_reset_error_failed"));
        setIsLoading(false);
        return;
      }

      setSuccess(t<string>("password_reset_success_title"));
      setIsLoading(false);
    } catch (err: any) {
      console.error("[reset-password] Error", err);
      setError(err?.message || t<string>("password_reset_error_internal"));
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full rounded-[32px] border border-border bg-card shadow-modal backdrop-blur-2xl px-10 py-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-emerald-500/20 dark:bg-emerald-500/20 border-2 border-emerald-500/30 dark:border-emerald-500/30 p-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 dark:text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {t<string>("password_reset_success_title")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t<string>("password_reset_success_message")}
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent-primary,#2563eb)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors"
        >
          {t<string>("password_reset_go_to_login")}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[32px] border border-border bg-card shadow-modal backdrop-blur-2xl px-10 py-10">
      <h1 className="mb-2 text-center text-[22px] font-semibold tracking-tight text-foreground">
        {t<string>("password_reset_new_password_title")}
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {t<string>("password_reset_description")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t<string>("password_reset_new_password_label")}
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
              className="h-10 w-full rounded-2xl border border-border bg-background px-4 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]"
              placeholder={t<string>("register_field_password_placeholder")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
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
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t<string>("password_reset_new_password_confirm_label")}
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
            className="h-10 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]"
            placeholder={t<string>("register_field_password_confirm_placeholder")}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !password || !passwordConfirm}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-600 dark:to-blue-500 px-4 py-2 text-sm font-medium text-white dark:text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] dark:shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:from-blue-500 hover:to-blue-400 dark:hover:from-blue-500 dark:hover:to-blue-400 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t<string>("password_reset_btn_changing")}
            </>
          ) : (
            <>
              {t<string>("password_reset_btn_change")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t<string>("password_reset_back_to_login")}
        </Link>
      </div>
    </div>
  );
}


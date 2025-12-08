"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PhoneStep } from "@/components/register/PhoneStep";
import { useLanguage } from "@/components/language-provider";

type Step = 1 | 2 | 3;

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

export default function RegisterDirectorClient() {
  const router = useRouter();
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>(1);
  
  // Маппинг локали для API: "en" | "ua" | "ru" -> "en" | "uk" | "ru"
  const localeForAPI = language === "ua" ? "uk" : language;

  const [baseData, setBaseData] = useState<BaseData>({
    firstName: "",
    lastName: "",
    middleName: "",
    birthDate: "",
    password: "",
  });

  const [form, setForm] = useState<FormState>({
    email: "",
    phone: "",
  });

  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Supabase клиент
  const supabase = useMemo<SupabaseClient | null>(() => {
    try {
      return createBrowserSupabaseClient();
    } catch (error) {
      console.error("Failed to create Supabase client:", error);
      return null;
    }
  }, []);

  // Сброс ошибок при смене шага
  useEffect(() => {
    setFormError(null);
    setFormSuccess(null);
    // Сбрасываем верификацию телефона при переходе на другие шаги
    if (step !== 3) {
      setPhoneVerified(false);
    }
  }, [step]);

  // Проверка подтверждения email на шаге 2
  useEffect(() => {
    if (!supabase || step !== 2 || !emailSent || emailVerified) {
      console.log("[register] useEffect skipped:", {
        hasSupabase: !!supabase,
        step,
        emailSent,
        emailVerified,
      });
      return;
    }

    let cancelled = false;

    // Подписка на изменения состояния аутентификации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || emailVerified) return;

      console.log("[register] Auth state changed:", {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        emailConfirmed: !!session?.user?.email_confirmed_at,
      });

      if (session?.user?.email_confirmed_at && !emailVerified) {
        console.log("[register] ✅ Email confirmed via auth state change!");
        setEmailVerified(true);
        cancelled = true;
      }
    });

    const checkEmailStatus = async () => {
      if (cancelled || emailVerified) {
        console.log("[register] checkEmailStatus skipped (cancelled or verified)");
        return;
      }

      try {
        console.log("[register] Checking email status...");
        
        // Сначала проверяем сессию (это обновит cookies если они изменились)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[register] Error getting session:", sessionError);
        } else {
          console.log("[register] Session:", {
            hasSession: !!session,
            userId: session?.user?.id,
            emailConfirmed: !!session?.user?.email_confirmed_at,
          });

          // Если сессия есть и email подтвержден, обновляем состояние
          if (session?.user?.email_confirmed_at && !emailVerified) {
            console.log("[register] ✅ Email confirmed via session!");
            setEmailVerified(true);
            cancelled = true;
            return;
          }
        }

        // Затем получаем пользователя (это также может обновить сессию)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          // Если ошибка "Auth session missing", используем альтернативный способ проверки
          if (
            userError.message?.includes("Auth session missing") ||
            userError.message?.includes("session")
          ) {
            console.log(
              "[register] No session available, checking via API route...",
            );

            // Проверяем через API route по email
            try {
              const response = await fetch("/api/auth/check-email-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email.trim() }),
              });

              const data = await response.json();

              if (data.success && data.emailVerified) {
                console.log(
                  "[register] ✅ Email confirmed via API route!",
                  data,
                );
                setEmailVerified(true);
                cancelled = true;
                return;
              } else {
                console.log(
                  "[register] Email not verified yet (checked via API):",
                  data,
                );
              }
            } catch (apiError) {
              console.error(
                "[register] Error checking via API route:",
                apiError,
              );
            }
          } else {
            console.error("[register] Error getting user:", userError);
          }
          return;
        }

        if (!user) {
          console.log("[register] No user found");
          return;
        }

        console.log("[register] User data:", {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          hasMetadata: !!user.user_metadata,
        });

        if (user.email_confirmed_at) {
          console.log(
            "[register] ✅ Email confirmed! email_confirmed_at:",
            user.email_confirmed_at,
          );
          setEmailVerified(true);
          cancelled = true;
          return;
        } else {
          console.log("[register] Email not confirmed yet");
        }
      } catch (error) {
        console.error("[register] Error checking email status:", error);
      }
    };

    const checkLocalStorage = async () => {
      try {
        const isConfirmed =
          window.localStorage.getItem("wellify_email_confirmed") === "true";
        console.log("[register] localStorage check:", {
          isConfirmed,
          emailVerified,
        });
        if (isConfirmed && !emailVerified) {
          console.log(
            "[register] ✅ Found localStorage flag, checking with Supabase...",
          );
          
          // Сначала пробуем через API route (работает без сессии)
          try {
            const response = await fetch("/api/auth/check-email-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: form.email.trim() }),
            });

            const data = await response.json();

            if (data.success && data.emailVerified) {
              console.log(
                "[register] ✅ Email confirmed via API route (from localStorage)!",
                data,
              );
              setEmailVerified(true);
              cancelled = true;
              return;
            }
          } catch (apiError) {
            console.warn("[register] API check failed, trying direct check:", apiError);
          }
          
          // Если API не сработал, пробуем обычную проверку
          checkEmailStatus();
        }
      } catch (e) {
        console.warn("[register] Cannot read localStorage:", e);
      }
    };

    const handleStorage = async (event: StorageEvent) => {
      if (
        event.key === "wellify_email_confirmed" &&
        event.newValue === "true"
      ) {
        console.log(
          "[register] Storage event received, checking email status...",
        );
        
        // Проверяем через API route (работает без сессии)
        try {
          const response = await fetch("/api/auth/check-email-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email.trim() }),
          });

          const data = await response.json();

          if (data.success && data.emailVerified) {
            console.log(
              "[register] ✅ Email confirmed via API route (from storage event)!",
              data,
            );
            setEmailVerified(true);
            cancelled = true;
            return;
          }
        } catch (apiError) {
          console.warn("[register] API check failed, trying direct check:", apiError);
        }
        
        checkEmailStatus();
      }
    };

    const handleCustom = async () => {
      console.log(
        "[register] Custom event 'emailConfirmed' received, checking email status...",
      );
      
      // Проверяем через API route (работает без сессии)
      try {
        const response = await fetch("/api/auth/check-email-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email.trim() }),
        });

        const data = await response.json();

        if (data.success && data.emailVerified) {
          console.log(
            "[register] ✅ Email confirmed via API route (from custom event)!",
            data,
          );
          setEmailVerified(true);
          cancelled = true;
          return;
        }
      } catch (apiError) {
        console.warn("[register] API check failed, trying direct check:", apiError);
      }
      
      checkEmailStatus();
    };

    // Проверяем сразу при монтировании
    checkLocalStorage();
    checkEmailStatus();

    // Слушаем события
    window.addEventListener("storage", handleStorage);
    window.addEventListener("emailConfirmed", handleCustom as EventListener);

    // Проверяем при возврате фокуса на вкладку
    const handleFocus = () => {
      if (!cancelled && !emailVerified) {
        console.log("[register] Window focused, checking email status...");
        checkLocalStorage();
        checkEmailStatus();
      }
    };
    window.addEventListener("focus", handleFocus);

    // Поллинг каждые 3 секунды
    const intervalId = setInterval(() => {
      if (!cancelled && !emailVerified) {
        checkEmailStatus();
      } else {
        clearInterval(intervalId);
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("emailConfirmed", handleCustom as EventListener);
      window.removeEventListener("focus", handleFocus);
    };
  }, [supabase, step, emailSent, emailVerified]);

  const validateStep1 = () => {
    if (!baseData.firstName.trim() || !baseData.lastName.trim()) {
      setFormError("Укажите имя и фамилию.");
      return false;
    }
    if (!baseData.birthDate.trim()) {
      setFormError("Укажите дату рождения.");
      return false;
    }
    if (!baseData.password || baseData.password.length < 8) {
      setFormError("Пароль должен содержать минимум 8 символов.");
      return false;
    }
    if (baseData.password !== passwordConfirm) {
      setFormError("Пароль и подтверждение пароля не совпадают.");
      return false;
    }
    return true;
  };

  const validatePhone = () => {
    if (!form.phone.trim()) {
      setFormError("Укажите телефон.");
      return false;
    }
    if (!phoneVerified) {
      setFormError("Телефон должен быть подтверждён.");
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

  const handleSendEmailVerification = async () => {
    if (!form.email.trim()) {
      setEmailError("Укажите e-mail.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setEmailError("Укажите корректный e-mail.");
      return;
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setEmailError("Ошибка конфигурации. Обратитесь к администратору.");
      console.error("Missing Supabase env");
      return;
    }

    if (!supabase) {
      setEmailError("Ошибка инициализации. Обновите страницу.");
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);
    setFormError(null);

    const redirectTo = `${
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://dev.wellifyglobal.com"
    }/auth/email-confirmed`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: baseData.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            firstName: baseData.firstName,
            lastName: baseData.lastName,
            middleName: baseData.middleName,
            birthDate: baseData.birthDate,
            role: "director",
          },
        },
      });

      if (error) {
        if (
          error.message?.includes("already registered") ||
          error.message?.includes("already exists")
        ) {
          const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email: form.email.trim(),
            options: {
              emailRedirectTo: redirectTo,
            },
          });

          if (resendError) {
            setEmailError(
              resendError.message || "Не удалось отправить письмо",
            );
            setIsSendingEmail(false);
            return;
          }

          setEmailSent(true);
          setEmailVerified(false);
          setIsSendingEmail(false);
          return;
        }

        setEmailError(error.message || "Не удалось отправить письмо");
        setIsSendingEmail(false);
        return;
      }

      console.log("signUp result:", data);
      setEmailSent(true);
      setEmailVerified(false);
    } catch (err: any) {
      console.error("Unexpected error sending email:", err);
      setEmailError(err.message || "Произошла ошибка. Попробуйте еще раз.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleChangeEmail = () => {
    setEmailSent(false);
    setEmailVerified(false);
    setEmailError(null);
    setFormError(null);
  };

  const handleCompleteRegistration = async () => {
    if (!phoneVerified) {
      setFormError("Сначала подтвердите телефон");
      return;
    }

    if (!supabase) {
      setFormError("Ошибка инициализации. Обновите страницу.");
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      // Сначала завершаем регистрацию (обновляем профиль)
      const res = await fetch("/api/director/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: baseData.firstName,
          lastName: baseData.lastName,
          middleName: baseData.middleName,
          birthDate: baseData.birthDate,
          email: form.email,
          phone: form.phone,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          // Пользователь не авторизован - выполняем вход
          console.log("[register] User not authenticated, signing in...");
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: form.email.trim(),
            password: baseData.password,
          });

          if (signInError || !signInData.user) {
            setFormError(
              "Пользователь не авторизован. Пожалуйста, выполните вход ещё раз."
            );
            setIsLoading(false);
            return;
          }

          // После успешного входа повторяем запрос на завершение регистрации
          const retryRes = await fetch("/api/director/complete-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName: baseData.firstName,
              lastName: baseData.lastName,
              middleName: baseData.middleName,
              birthDate: baseData.birthDate,
              email: form.email,
              phone: form.phone,
            }),
          });

          const retryData = await retryRes.json().catch(() => null);

          if (!retryRes.ok) {
            throw new Error(retryData?.error || "Не удалось завершить регистрацию");
          }

          // Успех: ведём директора в его дашборд
          router.push("/dashboard/director");
          return;
        }

        throw new Error(data?.error || "Не удалось завершить регистрацию");
      }

      // Успех: после завершения регистрации выполняем вход для установки сессии
      console.log("[register] Registration completed, signing in...");
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: baseData.password,
      });

      if (signInError) {
        console.error("[register] Sign in error:", signInError);
        setFormError(
          "Регистрация завершена, но не удалось войти. Пожалуйста, войдите вручную."
        );
        setIsLoading(false);
        return;
      }

      if (!signInData.user) {
        setFormError(
          "Регистрация завершена, но не удалось войти. Пожалуйста, войдите вручную."
        );
        setIsLoading(false);
        return;
      }

      // Успех: ведём директора в его дашборд
      router.push("/dashboard/director");
    } catch (err) {
      console.error("[register] Error in handleCompleteRegistration:", err);
      setFormError(
        err instanceof Error ? err.message : "Неизвестная ошибка регистрации"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Оставляем handleFinish для обратной совместимости
  const handleFinish = handleCompleteRegistration;

  const steps = [
    { id: 1, label: "Основные данные" },
    { id: 2, label: "E-mail" },
    { id: 3, label: "Телефон" },
  ];

  const renderStepHeader = () => (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-4">
        {steps.map((s) => (
          <div key={s.id} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-all ${
                step >= s.id ? "bg-primary" : "bg-zinc-800"
              }`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-zinc-400">
        {steps.map((s) => (
          <div key={s.id} className="flex-1 text-center">
            {s.label}
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-xs text-zinc-500">
        Шаг {step} из 3
      </div>
    </div>
  );

  const renderAlerts = () => {
    if (!formError && !formSuccess) {
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
            onChange={(e) =>
              setBaseData((prev) => ({ ...prev, firstName: e.target.value }))
            }
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
            onChange={(e) =>
              setBaseData((prev) => ({ ...prev, lastName: e.target.value }))
            }
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="Иванов"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Отчество</label>
          <input
            value={baseData.middleName}
            onChange={(e) =>
              setBaseData((prev) => ({ ...prev, middleName: e.target.value }))
            }
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
          onChange={(e) =>
            setBaseData((prev) => ({ ...prev, birthDate: e.target.value }))
          }
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Формат: ДД.ММ.ГГГГ
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Пароль <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={baseData.password}
              onChange={(e) =>
                setBaseData((prev) => ({ ...prev, password: e.target.value }))
              }
              className="h-11 w-full rounded-lg border border-border bg-card px-4 pr-10 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
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
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Подтвердите пароль <span className="text-destructive">*</span>
          </label>
          <input
            type={showPassword ? "text" : "password"}
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
          {isLoading ? "Загрузка..." : "Дальше"}
        </Button>
      </div>
    </form>
  );

  const renderStep2 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid =
      form.email.trim() && emailRegex.test(form.email.trim());

    const canGoNextFromEmailStep =
      emailVerified && !isLoading && !isSendingEmail;

    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            E-mail <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            disabled={emailVerified}
            className={`h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card ${
              emailVerified ? "opacity-60 cursor-not-allowed" : ""
            }`}
            placeholder="you@example.com"
          />
        </div>

        {emailSent && !emailVerified && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Мы отправили письмо с подтверждением на {form.email.trim()}. Перейдите
              по ссылке в письме. После подтверждения страница автоматически
              обновит статус.
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={isSendingEmail}
                onClick={handleChangeEmail}
              >
                Изменить e-mail
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={isSendingEmail || !isEmailValid}
                onClick={handleSendEmailVerification}
              >
                {isSendingEmail ? "Отправляем..." : "Отправить ещё раз"}
              </Button>
            </div>
          </div>
        )}
        {emailVerified && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>
              E-mail подтверждён. Можете перейти к следующему шагу.
            </span>
          </div>
        )}

        {emailError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{emailError}</span>
          </div>
        )}

        {renderAlerts()}

        <div className="mt-4 flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full md:w-auto"
            disabled={isSendingEmail}
            onClick={() => setStep(1)}
          >
            Назад
          </Button>

          {!emailSent ? (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={!form.email.trim() || isSendingEmail || !isEmailValid}
              onClick={handleSendEmailVerification}
            >
              {isSendingEmail ? "Отправляем..." : "Отправить письмо"}
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={!canGoNextFromEmailStep}
              onClick={async () => {
                // Если email уже подтвержден (проверено через API route), просто переходим
                if (emailVerified) {
                  console.log("[register] Email already verified, proceeding to step 3");
                  setFormError(null);
                  setStep(3);
                  return;
                }

                // Если emailVerified === false, проверяем через API route (без сессии)
                setFormError(null);
                try {
                  const response = await fetch("/api/auth/check-email-status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: form.email.trim() }),
                  });

                  const data = await response.json();

                  if (data.success && data.emailVerified) {
                    console.log("[register] Email confirmed via API route, proceeding to step 3");
                    setEmailVerified(true);
                    setFormError(null);
                    setStep(3);
                  } else {
                    setFormError("Почта ещё не подтверждена. Проверьте письмо и перейдите по ссылке.");
                  }
                } catch (error) {
                  console.error("[register] Error checking email on button click:", error);
                  setFormError("Ошибка при проверке статуса email. Попробуйте ещё раз.");
                }
              }}
            >
              Далее
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const canFinish = phoneVerified && !isLoading;

    return (
      <div className="space-y-4">
        {!phoneVerified ? (
          <PhoneStep
            initialPhone={form.phone}
            locale={localeForAPI}
            onPhoneVerified={(verifiedPhone) => {
              setForm((prev) => ({ ...prev, phone: verifiedPhone }));
              setPhoneVerified(true);
            }}
          />
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Телефон <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                disabled
                className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition opacity-60 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-emerald-400">
                Телефон подтверждён
              </p>
            </div>
          </div>
        )}

        {phoneVerified && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>
              Поздравляем! Ваш телефон подтверждён. Можете завершить регистрацию.
            </span>
          </div>
        )}

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
          <Button
            type="button"
            className="w-full md:w-auto"
            disabled={!canFinish}
            onClick={handleCompleteRegistration}
          >
            {isLoading ? "Завершаем..." : "Завершить регистрацию"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <main className="flex mt-[72px] min-h-[calc(100vh-72px)] items-center justify-center px-4">
      <Card className="w-full max-w-xl border border-white/5 bg-[radial-gradient(circle_at_top,_rgba(62,132,255,0.18),_transparent_55%),_rgba(7,13,23,0.96)] shadow-[0_18px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <CardHeader className="pb-4">
          {renderStepHeader()}
          <CardTitle className="text-xl font-semibold text-center">
            Создать аккаунт директора
          </CardTitle>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
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

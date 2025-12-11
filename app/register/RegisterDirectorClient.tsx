"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
import { useLanguage } from "@/components/language-provider";
import { TelegramVerificationStep } from "./TelegramVerificationStep";

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
  phone: string; // пока оставляем, но телефон теперь приходит из Telegram/БД
}

const SESSION_STORAGE_KEY = "wellify_register_state";

export default function RegisterDirectorClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>(1);
  const isInitialMount = useRef(true);

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

  // E-mail верификация через Supabase
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "link_sent" | "checking" | "verified" | "error"
  >("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [confirmedUserId, setConfirmedUserId] = useState<string | undefined>(
    undefined
  );
  // Таймер для повторной отправки письма (60 секунд)
  const [resendCooldown, setResendCooldown] = useState(0);

  // СТАРЫЕ состояния для телефона (Twilio) пока оставляем, чтобы не ломать логику,
  // но использовать их больше не будем
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState<
    "idle" | "verifying" | "verified"
  >("idle");

  // НОВОЕ состояние: подтверждение через Telegram
  const [telegramVerified, setTelegramVerified] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // Состояние для завершения регистрации
  const [finishLoading, setFinishLoading] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  // Supabase клиент
  const [supabase] = useState(() => createBrowserSupabaseClient());

  // Функция для полной очистки состояния регистрации
  const clearRegistrationState = () => {
    if (typeof window === "undefined") return;

    // Очищаем sessionStorage
    sessionStorage.removeItem(SESSION_STORAGE_KEY);

    localStorage.removeItem("register_in_progress");
    localStorage.removeItem("register_email");
    localStorage.removeItem("wellify_email");
    localStorage.removeItem("wellify_email_confirmed");
    localStorage.removeItem("wellify_email_confirmed_for");

    setStep(1);
    setForm({ email: "", phone: "" });
    setBaseData({
      firstName: "",
      lastName: "",
      middleName: "",
      birthDate: "",
      password: "",
    });
    setPasswordConfirm("");
    setEmailStatus("idle");
    setEmailError(null);
    setEmailVerified(false);
    setPhoneVerified(false);
    setTelegramVerified(false);
    setFormError(null);
    setFormSuccess(null);
    setFinishError(null);

    // Выходим из сессии Supabase
    supabase.auth.signOut().catch((err) => {
      console.warn("Error signing out:", err);
    });
  };

  // ========== СОХРАНЕНИЕ СОСТОЯНИЯ В SESSION STORAGE ==========
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInitialMount.current) return;

    try {
      const stateToSave = {
        step,
        baseData,
        form: {
          email: form.email,
          phone: form.phone,
        },
        emailVerified,
        // phoneVerified больше не критичен, но оставляем для совместимости
        phoneVerified,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn("[register] Failed to save state to sessionStorage", error);
    }
  }, [step, baseData, form.email, form.phone, emailVerified, phoneVerified]);

  // ========== ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ ПРИ MOUNT ==========
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isInitialMount.current) return;

    const shouldStartNew =
      searchParams.get("new") === "true" ||
      searchParams.get("reset") === "true";

    if (shouldStartNew) {
      clearRegistrationState();
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      router.replace("/register", { scroll: false });
      isInitialMount.current = false;
      return;
    }

    const savedStateStr = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (savedStateStr) {
      try {
        const savedState = JSON.parse(savedStateStr);
        const restoredStep = savedState.step || 1;

        if (restoredStep === 3) {
          if (savedState.baseData) {
            setBaseData(savedState.baseData);
          }
          setForm({
            email: savedState.form?.email || "",
            phone: "",
          });
          setStep(3);
          setEmailStatus("link_sent");
          setEmailVerified(false);
        } else if (restoredStep === 2) {
          if (savedState.baseData) {
            setBaseData(savedState.baseData);
          }
          setForm({
            email: "",
            phone: "",
          });
          setStep(2);
          setEmailStatus("idle");
          setEmailError(null);
          setEmailVerified(false);
        } else {
          setBaseData({
            firstName: "",
            lastName: "",
            middleName: "",
            birthDate: "",
            password: "",
          });
          setForm({
            email: "",
            phone: "",
          });
          setStep(1);
        }
      } catch (e) {
        console.error("[register] Error restoring state from sessionStorage", e);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } else {
      localStorage.removeItem("register_email");
      localStorage.removeItem("wellify_email_confirmed");
      localStorage.removeItem("wellify_email_confirmed_for");
    }

    isInitialMount.current = false;
  }, [searchParams, router]);

  // ========== ОЧИСТКА ПРИ УХОДЕ СО СТРАНИЦЫ ==========
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInitialMount.current) return;

    if (pathname && pathname !== "/register") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [pathname]);

  // Сброс ошибок при смене шага
  useEffect(() => {
    setFormError(null);
    setFormSuccess(null);
    if (step !== 2) {
      setEmailVerified(false);
      setEmailStatus("idle");
      setEmailError(null);
    }
    // При уходе с шага 3 Telegram-верификацию не сбрасываем, но можно при необходимости
  }, [step]);

  // Авто-проверка e-mail через polling (оставляем без изменений)
  useEffect(() => {
    if (emailStatus !== "link_sent") {
      console.log("[register] Polling not started: emailStatus !== 'link_sent'", { emailStatus });
      return;
    }
    if (!form.email.trim()) {
      console.log("[register] Polling not started: email is empty");
      return;
    }
    if (emailVerified) {
      console.log("[register] Polling not started: email already verified");
      return;
    }

    console.log("[register] 🚀 Starting email verification polling", {
      email: form.email.trim(),
      emailStatus,
      emailVerified,
    });

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;
    let hasStartedPolling = false;

    const checkEmailConfirmation = async () => {
      try {
        if (cancelled) return;

        const emailParam = encodeURIComponent(form.email.trim());
        const res = await fetch(`/api/auth/check-email-confirmed?email=${emailParam}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          if (res.status === 401) {
            console.log("[register] User not authenticated yet, continuing polling...");
          } else {
            console.error("[register] check-email-confirmed API error:", res.status);
          }
          return;
        }

        const data = await res.json();

        console.log("[register] checkEmailConfirmation response", {
          success: data.success,
          emailConfirmed: data.emailConfirmed,
          fullResponse: data,
        });

        if (data.success === true && data.emailConfirmed === true) {
          if (!cancelled) {
            console.log("[register] ✅ Email verified (email_verified = TRUE)!");
            setEmailStatus("verified");
            setEmailVerified(true);
            setFormSuccess("Отлично! Ваша почта подтверждена, можете переходить к 3 шагу.");
            setEmailError(null);

            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }

            if (typeof window !== "undefined") {
              localStorage.setItem("wellify_email_confirmed", "true");
              localStorage.setItem(
                "wellify_email_confirmed_for",
                form.email.trim().toLowerCase()
              );
              localStorage.removeItem("register_email");
            }
          }
        } else {
          console.log("[register] ⏳ Email not confirmed yet, continuing polling...", {
            email: form.email.trim(),
            success: data.success,
            emailConfirmed: data.emailConfirmed,
            reason: data.reason,
          });
        }
      } catch (e) {
        console.error("[register] checkEmailConfirmation exception", e);
      }
    };

    const initialDelay = setTimeout(() => {
      if (!cancelled && !emailVerified && emailStatus === "link_sent") {
        hasStartedPolling = true;
        console.log("[register] 🔍 Starting first email check after delay");
        checkEmailConfirmation();
      } else {
        console.log("[register] ⚠️ First check skipped", {
          cancelled,
          emailVerified,
          emailStatus,
        });
      }
    }, 3000);

    intervalId = setInterval(() => {
      if (
        !cancelled &&
        !emailVerified &&
        emailStatus === "link_sent" &&
        hasStartedPolling
      ) {
        checkEmailConfirmation();
      } else if (emailVerified && intervalId) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (initialDelay) {
        clearTimeout(initialDelay);
      }
    };
  }, [emailStatus, form.email, emailVerified]);

  // Таймер для resend email
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timerId = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [resendCooldown]);

  // Сохранение состояния регистрации в localStorage (оставляем как было)
  useEffect(() => {
    if (step > 1 || form.email || form.phone) {
      const state = {
        step,
        email: form.email,
        phone: form.phone,
        baseData,
        emailVerified,
        phoneVerified,
      };
      localStorage.setItem("register_in_progress", JSON.stringify(state));
    }
  }, [step, form.email, form.phone, baseData, emailVerified, phoneVerified]);

  const validateStep1 = () => {
    if (!baseData.firstName.trim() || !baseData.lastName.trim()) {
      setFormError("Укажите имя и фамилию.");
      return false;
    }
    if (!baseData.middleName.trim()) {
      setFormError("Укажите отчество.");
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

  const handleNextFromStep1 = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validateStep1()) return;
    setStep(2);
  };

  // ====== EMAIL SIGNUP / SEND LINK ======
  const handleSendEmailLink = async () => {
    if (emailStatus === "sending") {
      console.warn("[register] handleSendEmailLink already in progress");
      return;
    }

    let timeoutId: NodeJS.Timeout | null = null;

    try {
      setEmailError(null);
      setFormError(null);
      setFormSuccess(null);
      setEmailStatus("sending");

      timeoutId = setTimeout(() => {
        console.error("[register] handleSendEmailLink timeout - resetting status");
        setEmailStatus("error");
        setEmailError("Превышено время ожидания. Попробуйте ещё раз.");
      }, 30000);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
        setEmailStatus("error");
        setEmailError("Пожалуйста, введите корректный e-mail адрес.");
        return;
      }

      if (
        !baseData.firstName.trim() ||
        !baseData.lastName.trim() ||
        !baseData.password
      ) {
        setEmailStatus("error");
        setEmailError("Пожалуйста, заполните все обязательные поля на шаге 1.");
        return;
      }

      console.log("[register] Checking if email already exists in database", {
        email: form.email.trim(),
      });

      try {
        const checkEmailRes = await fetch("/api/auth/check-email-exists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email.trim() }),
        });

        if (checkEmailRes.ok) {
          const checkEmailData = await checkEmailRes.json();

          if (checkEmailData.exists === true) {
            console.log("[register] Email already exists, blocking registration", {
              email: form.email.trim(),
            });

            if (timeoutId) clearTimeout(timeoutId);
            setEmailStatus("error");
            setEmailError(
              "Этот e-mail уже зарегистрирован. Пожалуйста, войдите в систему."
            );
            return;
          }
        } else {
          console.warn(
            "[register] Failed to check email existence, continuing registration",
            { status: checkEmailRes.status }
          );
        }
      } catch (checkError) {
        console.warn(
          "[register] Error checking email existence, continuing registration",
          checkError
        );
      }

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/email-confirmed`
          : `${
              process.env.NEXT_PUBLIC_SITE_URL ?? "https://dev.wellifyglobal.com"
            }/email-confirmed`;

      const fullName = [
        baseData.lastName.trim(),
        baseData.firstName.trim(),
        baseData.middleName.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const birthDateFormatted = baseData.birthDate;

      console.log("[register] Sending email verification", {
        email: form.email.trim(),
        redirectTo,
      });

      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: baseData.password,
        options: {
          data: {
            first_name: baseData.firstName.trim(),
            last_name: baseData.lastName.trim(),
            middle_name: baseData.middleName.trim(),
            full_name: fullName,
            birth_date: birthDateFormatted,
            locale: localeForAPI,
          },
          emailRedirectTo: redirectTo,
        },
      });

      console.log("[register] signUp response", {
        hasData: !!data,
        hasUser: !!data?.user,
        userId: data?.user?.id,
        email: data?.user?.email,
        error: error?.message,
        errorStatus: error?.status,
      });

      if (error) {
        console.error("[register] signUp error", error);
        if (timeoutId) clearTimeout(timeoutId);

        const errorMessage = error.message?.toLowerCase() || "";
        const errorCode = error.status || (error as any).code;

        if (
          errorMessage.includes("already registered") ||
          errorMessage.includes("already exists") ||
          errorMessage.includes("user already registered") ||
          errorMessage.includes("email already registered") ||
          errorCode === 400 ||
          errorCode === 422
        ) {
          setEmailStatus("error");
          setEmailError(
            "Этот e-mail уже зарегистрирован. Пожалуйста, войдите в систему."
          );
          return;
        } else {
          setEmailStatus("error");
          setEmailError(
            error.message || "Не удалось отправить письмо. Попробуйте ещё раз."
          );
          return;
        }
      }

      if (!data || !data.user) {
        console.error("[register] signUp returned no user", { data });
        if (timeoutId) clearTimeout(timeoutId);
        setEmailStatus("error");
        setEmailError(
          "Не удалось создать пользователя. Пожалуйста, попробуйте ещё раз."
        );
        return;
      }

      const normalizedEmail = form.email.trim().toLowerCase();
      if (typeof window !== "undefined") {
        localStorage.setItem("register_email", normalizedEmail);
        localStorage.removeItem("wellify_email_confirmed");
        localStorage.removeItem("wellify_email_confirmed_for");
      }
      if (timeoutId) clearTimeout(timeoutId);
      setEmailStatus("link_sent");
      setEmailVerified(false);
      setFormSuccess(null);
      setResendCooldown(60);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.warn(
          "[register] ⚠️ No session after signUp, email will be checked via email parameter"
        );
      } else {
        console.log("[register] ✅ Session created after signUp", {
          userId: session.user.id,
        });
      }

      console.log("[register] ✅ Email sent successfully", {
        email: normalizedEmail,
        userId: data.user.id,
        emailConfirmed: !!data.user.email_confirmed_at,
        hasSession: !!session,
      });
    } catch (e: any) {
      console.error("[register] handleSendEmailLink exception", e);
      if (timeoutId) clearTimeout(timeoutId);
      setEmailStatus("error");
      setEmailError(
        e?.message ?? "Не удалось отправить письмо. Попробуйте ещё раз."
      );
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    await handleSendEmailLink();
  };

  const handleChangeEmail = async () => {
    setEmailStatus("idle");
    setEmailError(null);
    setFormError(null);
    setFormSuccess(null);
    setEmailVerified(false);

    if (typeof window !== "undefined") {
      localStorage.removeItem("register_email");
      localStorage.removeItem("wellify_email");
      localStorage.removeItem("wellify_email_confirmed");
      localStorage.removeItem("wellify_email_confirmed_for");

      const saved = localStorage.getItem("register_in_progress");
      if (saved) {
        try {
          const state = JSON.parse(saved);
          state.email = "";
          state.step = 2;
          localStorage.setItem("register_in_progress", JSON.stringify(state));
        } catch (e) {
          localStorage.removeItem("register_in_progress");
        }
      }
    }

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Error signing out:", err);
    }

    setForm((prev) => ({ ...prev, email: "" }));
    setEmailStatus("idle");
    setFormError(null);
    setFormSuccess(null);
  };

  // ========= ЗАВЕРШЕНИЕ РЕГИСТРАЦИИ =========
  const finishRegistration = async () => {
    try {
      setFinishLoading(true);
      setFinishError(null);

      // 1. Email должен быть подтверждён
      if (emailStatus !== "verified" || !emailVerified) {
        setFinishError(
          "E-mail должен быть подтверждён. Вернитесь на предыдущий шаг."
        );
        setFinishLoading(false);
        return;
      }

      // 2. Telegram уже подтвердил телефон и записал его в Supabase (telegram_verified = true)
      // Мы доверяем этому шагу (TelegramVerificationStep вызывает finishRegistration только после успешной верификации).

      const registrationData = {
        email: form.email.trim(),
        password: baseData.password,
        // телефон теперь берём из профиля на backend, но поле оставим опционально
        phone: form.phone.trim() || undefined,
        firstName: baseData.firstName.trim(),
        lastName: baseData.lastName.trim(),
        middleName: baseData.middleName.trim(),
      };

      const res = await fetch("/api/auth/register-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const errorMessage =
          data?.message ||
          "Не удалось завершить регистрацию. Попробуйте ещё раз.";
        setFinishError(errorMessage);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: baseData.password,
      });

      if (signInError) {
        setFinishError(
          "Аккаунт создан, но не удалось выполнить вход. Попробуйте войти вручную на странице входа."
        );
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("register_in_progress");
        localStorage.removeItem("wellify_email_confirmed");
        localStorage.removeItem("wellify_email_confirmed_for");
        localStorage.removeItem("register_email");
      }

      router.push("/dashboard/director");
    } catch (e: any) {
      console.error("finishRegistration error", e);
      setFinishError(
        e?.message ?? "Неизвестная ошибка при завершении регистрации"
      );
    } finally {
      setFinishLoading(false);
    }
  };

  const handleCompleteRegistration = finishRegistration;
  const handleFinish = handleCompleteRegistration;

  const steps = [
    { id: 1, label: "Основные данные" },
    { id: 2, label: "E-mail" },
    { id: 3, label: "Телефон" }, // по факту Telegram-подтверждение телефона
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
            Отчество <span className="text-destructive">*</span>
          </label>
          <input
            value={baseData.middleName}
            onChange={(e) =>
              setBaseData((prev) => ({ ...prev, middleName: e.target.value }))
            }
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="Иванович"
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

    const isEmailInputDisabled =
      emailStatus === "sending" ||
      emailStatus === "link_sent" ||
      emailStatus === "verified";

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
            disabled={isEmailInputDisabled}
            className={`h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card ${
              isEmailInputDisabled ? "opacity-60 cursor-not-allowed" : ""
            }`}
            placeholder="you@example.com"
          />
        </div>

        <div className="mt-3">
          {emailStatus === "sending" && (
            <div className="w-full rounded-lg border border-blue-500/40 bg-blue-500/10 p-4 text-sm text-blue-300">
              Отправляем письмо...
            </div>
          )}
          {emailStatus === "link_sent" && (
            <div className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              Мы отправили письмо на <strong>{form.email.trim()}</strong>.
              Пожалуйста, подтвердите e-mail, чтобы продолжить.
            </div>
          )}
        </div>

        {emailError && (
          <div className="mt-3 w-full rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
            <div className="flex flex-col gap-2">
              <span>{emailError}</span>
              {emailError.includes("уже зарегистрирован") && (
                <Link
                  href="/login"
                  className="text-red-300 underline hover:text-red-200 transition-colors"
                >
                  Перейти на страницу входа →
                </Link>
              )}
            </div>
          </div>
        )}

        {emailStatus === "link_sent" && !emailVerified && (
          <div className="mt-4 flex flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleResendEmail}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `Отправить письмо ещё раз (${resendCooldown}с)`
                : "Отправить письмо ещё раз"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleChangeEmail}
              disabled={false}
            >
              Изменить e-mail
            </Button>
          </div>
        )}

        {formSuccess && emailStatus === "verified" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}
        {formError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="mt-4 flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full md:w-auto"
            disabled={emailStatus === "sending"}
            onClick={() => setStep(1)}
          >
            Назад
          </Button>

          {(emailStatus === "idle" ||
            emailStatus === "error" ||
            emailStatus === "sending") && (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={!isEmailValid || emailStatus === "sending"}
              onClick={handleSendEmailLink}
            >
              {emailStatus === "sending" ? "Отправка..." : "Отправить письмо"}
            </Button>
          )}

          {emailStatus === "verified" && emailVerified === true && (
            <Button
              type="button"
              className="w-full md:w-auto"
              onClick={() => setStep(3)}
            >
              Далее
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ========== ШАГ 3: TELEGRAM ==========
  const renderStep3 = () => {
    return (
      <div className="space-y-4">
        {finishError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{finishError}</span>
          </div>
        )}

        {/* Основной компонент Telegram-верификации */}
        <TelegramVerificationStep
          language={localeForAPI}
          onVerified={async () => {
            // этот колбэк вызывается, когда Railway / Telegram подтвердили телефон
            setTelegramVerified(true);
            await finishRegistration();
          }}
        />

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:justify-between">
          <Button
            type="button"
            variant="outline"
            className="w-full md:w-auto"
            disabled={finishLoading}
            onClick={() => setStep(2)}
          >
            Назад
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

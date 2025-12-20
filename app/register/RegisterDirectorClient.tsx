// app/register/RegisterDirectorClient.tsx (ФИНАЛЬНЫЙ КОД)

"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Calendar,
  Mail,
  Lock,
  Loader2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { TelegramVerificationStep } from "./TelegramVerificationStep";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

type Step = 1 | 2 | 3 | 4;

interface PersonalForm {
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  password: string;
  passwordConfirm: string;
}

export default function RegisterDirectorClient() {
  const router = useRouter();
  const { language } = useLanguage();

  const [step, setStep] = useState<Step>(1);
  const [maxStepReached, setMaxStepReached] = useState<Step>(1);

  const [personal, setPersonal] = useState<PersonalForm>({
    firstName: "",
    middleName: "",
    lastName: "",
    birthDate: "",
    password: "",
    passwordConfirm: "",
  });

  const [email, setEmail] = useState("");
  const [emailExistsError, setEmailExistsError] = useState(false);

  const [registerError, setRegisterError] = useState<string | null>(null);

  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [registeredUserEmail, setRegisteredUserEmail] = useState<string | null>(
    null
  );
  const [registeredUserPhone, setRegisteredUserPhone] = useState<string | null>(
    null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // e-mail verification
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "link_sent" | "verified" | "error"
  >("idle");
  const [emailVerified, setEmailVerified] = useState(false);

  // Показ/скрытие пароля
  const [showPassword, setShowPassword] = useState(false);

  const [supabase] = useState(() => createBrowserSupabaseClient());

  const localeForAPI =
    language === "ua" ? "uk" : (language as "ru" | "uk" | "en" | string);

  // ---------- helpers ----------

  const handlePersonalChange =
    (field: keyof PersonalForm) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setPersonal((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleNextFromStep1 = () => {
    setRegisterError(null);
    setEmailExistsError(false);

    if (!personal.firstName.trim() || !personal.lastName.trim()) {
      setRegisterError("Укажите имя и фамилию директора.");
      return;
    }

    if (!personal.birthDate) {
      setRegisterError("Укажите дату рождения директора.");
      return;
    }

    if (!personal.password || personal.password.length < 8) {
      setRegisterError("Пароль должен содержать не менее 8 символов.");
      return;
    }

    if (personal.password !== personal.passwordConfirm) {
      setRegisterError("Пароль и подтверждение не совпадают.");
      return;
    }

    setRegisterError(null);
    setEmailExistsError(false);
    setStep(2);
    setMaxStepReached((prev) => (prev < 2 ? 2 : prev));
  };

  const handleSubmitStep2 = async (e: FormEvent) => {
    e.preventDefault();
    await handleSendEmailLink();
  };

  const handleSendEmailLink = async () => {
    if (emailStatus === "sending" || emailStatus === "link_sent") return;

    setRegisterError(null);
    setEmailExistsError(false);

    if (!email.trim()) {
      setRegisterError("Укажите рабочий e-mail.");
      setEmailStatus("error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setRegisterError("Введите корректный e-mail адрес.");
      setEmailStatus("error");
      return;
    }

    if (
      !personal.firstName.trim() ||
      !personal.lastName.trim() ||
      !personal.password
    ) {
      setRegisterError(
        "Пожалуйста, заполните личные данные и пароль на шаге 1."
      );
      setEmailStatus("error");
      return;
    }

    setEmailStatus("sending");
    setIsSubmitting(true);

    try {
      const fullName = [
        personal.firstName.trim(),
        personal.middleName.trim(),
        personal.lastName.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      // ВАЖНО: emailRedirectTo должен указывать на роут, который обрабатывает код подтверждения
      // Роут /auth/confirm обрабатывает код и обменивает его на сессию через exchangeCodeForSession
      // После этого пользователь редиректится на /auth/email-confirmed
      // ВАЖНО: Используем только прямое статическое обращение к NEXT_PUBLIC_APP_URL
      // для гарантии, что Next.js встроит значение в клиентский бандл
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/confirm`
          : `${process.env.NEXT_PUBLIC_APP_URL || "https://business.wellifyglobal.com"}/auth/confirm`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: personal.password,
        options: {
          data: {
            first_name: personal.firstName.trim(),
            last_name: personal.lastName.trim(),
            middle_name: personal.middleName.trim() || null,
            full_name: fullName || null,
            birth_date: personal.birthDate || null,
            locale: localeForAPI,
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        console.error("[register] signUp error", error);
        setEmailStatus("error");
        const msg = error.message?.toLowerCase() || "";
        if (
          msg.includes("already") ||
          msg.includes("exists") ||
          msg.includes("registered") ||
          msg.includes("user already registered") ||
          msg.includes("email already exists")
        ) {
          setEmailExistsError(true);
          setRegisterError(
            "Этот e-mail уже зарегистрирован."
          );
          // Блокируем переход на следующие шаги
          setMaxStepReached(2);
        } else {
          setEmailExistsError(false);
          setRegisterError(
            error.message ||
              "Не удалось отправить письмо. Попробуйте ещё раз позже."
          );
        }
        return;
      }

      if (!data?.user) {
        console.error("[register] signUp returned no user", { data });
        setEmailStatus("error");
        setRegisterError(
          "Не удалось создать учетную запись. Попробуйте ещё раз."
        );
        return;
      }

      setRegisteredUserId(data.user.id);
      setRegisteredUserEmail(data.user.email ?? email.trim());

      setEmailStatus("link_sent");
    } catch (err) {
      console.error("[register] handleSendEmailLink error", err);
      setEmailStatus("error");
      setRegisterError("Внутренняя ошибка. Попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setRegisterError(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  const canGoToStep = (target: Step) => {
    if (target === 1) return true;
    if (target === 2) return maxStepReached >= 2;
    if (target === 3) return emailVerified && maxStepReached >= 3;
    return false;
  };

  const finishRegistration = async () => {
    try {
      setIsSubmitting(true);
      setRegisterError(null);

      if (!emailVerified || !registeredUserEmail) {
        setRegisterError(
          "E-mail должен быть подтвержден по ссылке из письма, прежде чем завершать регистрацию."
        );
        return;
      }

      // !!! КРИТИЧНО: ИСПРАВЛЕНИЕ 400 Bad Request !!!
      if (!registeredUserPhone) {
        setRegisterError("Телефон должен быть подтвержден через Telegram.");
        return;
      }
      
      const payload = {
        userId: registeredUserId, // Передаем userId для прямого getUserById
        email: registeredUserEmail,
        password: personal.password,
        phone: registeredUserPhone, // Phone из Telegram верификации
        firstName: personal.firstName.trim(),
        lastName: personal.lastName.trim(),
        middleName: personal.middleName.trim() || null, // ГАРАНТИРУЕМ null
        birthDate: personal.birthDate || null, // ГАРАНТИРУЕМ null
        locale: localeForAPI,
      };
      // !!! КОНЕЦ КРИТИЧНОГО ИСПРАВЛЕНИЯ !!!

      const res = await fetch("/api/auth/register-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const msg =
          data?.message ||
          data?.error ||
          "Не удалось завершить регистрацию директора.";
        setRegisterError(msg);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: registeredUserEmail,
        password: personal.password,
      });

      if (signInError) {
        console.warn("[register] signIn error", signInError);
        setRegisterError(
          "Аккаунт создан, но не удалось выполнить вход. Попробуйте войти вручную."
        );
        return;
      }

      router.push("/dashboard/director");
    } catch (e) {
      console.error("finishRegistration error", e);
      setRegisterError(
        "Неизвестная ошибка при завершении регистрации. Попробуйте позже."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTelegramVerified = async (phone?: string) => {
    // Сохраняем phone если передан
    if (phone) {
      setRegisteredUserPhone(phone);
    }
    // Переходим на шаг 4 - успешное завершение
    setStep(4);
    setMaxStepReached(4);
  };

  // ---------- Проверка при монтировании, если email уже подтвержден ----------
  // Если пользователь вернулся на страницу после подтверждения email
  useEffect(() => {
    if (emailStatus !== "link_sent") return;
    if (!registeredUserId) return;
    if (emailVerified) return; // Уже подтвержден
    
    // Проверяем сразу при монтировании, если на шаге 2
    const checkInitialStatus = async () => {
      try {
        const url = `/api/auth/check-email-confirmed?userId=${encodeURIComponent(registeredUserId)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.success && (data.emailConfirmed || data.emailVerified)) {
            console.log("[register] Email already verified on mount, transitioning to step 3");
            setEmailStatus("verified");
            setEmailVerified(true);
            setStep(3);
            setMaxStepReached((prev) => (prev < 3 ? 3 : prev));
          }
        }
      } catch (e) {
        console.error("[register] Initial check error", e);
      }
    };
    
    checkInitialStatus();
  }, [emailStatus, registeredUserId, emailVerified]);

  // ---------- слушатель изменений состояния аутентификации ----------
  // Реагирует на подтверждение email в других вкладках через onAuthStateChange
  // Это обеспечивает синхронизацию между вкладками через cookies/session
  useEffect(() => {
    if (emailStatus !== "link_sent") return;
    if (!registeredUserId) return;

    console.log("[register] Setting up onAuthStateChange listener for userId:", registeredUserId);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log("[register] onAuthStateChange event:", event, "hasSession:", !!session, "userId:", session?.user?.id);
      
      // Обрабатываем события SIGNED_IN, USER_UPDATED, TOKEN_REFRESHED и SIGNED_OUT
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        if (!session?.user) {
          console.log("[register] No user in session");
          return;
        }

        // Проверяем, что это наш пользователь
        if (session.user.id !== registeredUserId) {
          console.log("[register] User ID mismatch:", session.user.id, "!=", registeredUserId);
          return;
        }

        // Проверяем, что email подтвержден
        if (session.user.email_confirmed_at) {
          console.log("[register] Email confirmed via onAuthStateChange, email_confirmed_at:", session.user.email_confirmed_at);
          
          // Обновляем состояние
          setEmailStatus("verified");
          setEmailVerified(true);
          setRegisterError(null);

          // Переходим на шаг 3 (Telegram)
          setStep(3);
          setMaxStepReached((prev) => (prev < 3 ? 3 : prev));
        } else {
          console.log("[register] User signed in but email not confirmed yet");
        }
      }
    });

    return () => {
      console.log("[register] Cleaning up onAuthStateChange listener");
      subscription.unsubscribe();
    };
  }, [emailStatus, registeredUserId, supabase]);

  // ---------- Realtime подписка на изменения в таблице profiles ----------
  // Реагирует на UPDATE события в таблице profiles, когда email_verified становится true
  useEffect(() => {
    if (emailStatus !== "link_sent") return;
    if (!registeredUserId) return;

    console.log("[register] Setting up Realtime subscription for profiles table, userId:", registeredUserId);

    // Создаем канал для подписки на изменения в таблице profiles
    const channel = supabase
      .channel(`profiles:${registeredUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${registeredUserId}`,
        },
        (payload: { new: { id: string; email_verified?: boolean }; old: Record<string, any> }) => {
          console.log("[register] Realtime UPDATE event received:", payload);
          
          // Проверяем, что email_verified стал true
          const newRecord = payload.new;
          if (newRecord.email_verified === true) {
            console.log("[register] email_verified became true via Realtime, transitioning to step 3");
            setEmailStatus("verified");
            setEmailVerified(true);
            setRegisterError(null);

            // Переходим на шаг 3 (Telegram)
            setStep(3);
            setMaxStepReached((prev) => (prev < 3 ? 3 : prev));
          }
        }
      )
      .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
        console.log("[register] Realtime channel status:", status);
        if (status === 'SUBSCRIBED') {
          console.log("[register] Successfully subscribed to profiles Realtime channel");
        } else if (status === 'CHANNEL_ERROR') {
          console.error("[register] Realtime channel error");
        }
      });

    return () => {
      console.log("[register] Cleaning up Realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [emailStatus, registeredUserId, supabase]);

  // ---------- polling e-mail confirmation (fallback) ----------
  // Проверяем email_verified в БД через API как резервный механизм
  useEffect(() => {
    if (emailStatus !== "link_sent") return;
    if (!registeredUserId) return;
    
    // Если email уже подтвержден, не нужен polling
    if (emailVerified) return;

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    const check = async () => {
      if (cancelled) return;

      try {
        // Используем userId (предпочтительно) вместо email
        const url = `/api/auth/check-email-confirmed?userId=${encodeURIComponent(registeredUserId)}`;
        const res = await fetch(url);

        if (!res.ok) {
          return;
        }

        const data = await res.json();

        // Проверяем emailConfirmed (из Auth) ИЛИ emailVerified (из профиля)
        // emailVerified из профиля - это основной индикатор, т.к. он устанавливается после подтверждения
        const isVerified = data.success && (data.emailConfirmed || data.emailVerified);
        
        console.log("[register] Polling check result:", {
          success: data.success,
          emailConfirmed: data.emailConfirmed,
          emailVerified: data.emailVerified,
          isVerified,
        });

        if (isVerified) {
          console.log("[register] Email verified via polling, transitioning to step 3");
          setEmailStatus("verified");
          setEmailVerified(true);
          setRegisterError(null);

          setStep(3);
          setMaxStepReached((prev) => (prev < 3 ? 3 : prev));

          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (e) {
        console.error("[register] check-email-confirmed error", e);
      }
    };

    // Первая проверка сразу, затем каждые 1.5 секунды
    check(); // Проверяем сразу
    intervalId = setInterval(check, 1500);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [emailStatus, registeredUserId, emailVerified]); // Добавили emailVerified в зависимости

  // ---------- render helpers ----------

  const renderTabs = () => {
    const tabs: { id: Step; label: string }[] = [
      { id: 1, label: "Основные данные" },
      { id: 2, label: "E-mail" },
      { id: 3, label: "Telegram" },
    ];

    return (
      <div className="mb-5 flex items-center justify-between rounded-full border border-zinc-800/80 bg-zinc-950/70 px-1 py-1 text-[13px] text-zinc-300">
        {tabs.map((tab) => {
          const active = step === tab.id;
          const reachable = canGoToStep(tab.id);

          return (
            <button
              key={tab.id}
              type="button"
              disabled={!reachable}
              onClick={() => reachable && setStep(tab.id)}
              className={[
                "flex-1 rounded-full px-3 py-1.5 text-center transition-all",
                active
                  ? "bg-[var(--accent-primary,#2563eb)] text-white shadow-[0_0_25px_rgba(37,99,235,0.55)]"
                  : reachable
                  ? "text-zinc-300 hover:bg-zinc-800/60"
                  : "text-zinc-500 cursor-default",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderStepTitle = () => {
    let descriptionText: string | null = null;

    if (step === 1) {
      descriptionText =
        "Укажите личные данные директора и задайте пароль для входа.";
    } else if (step === 2) {
      descriptionText =
        "Укажите рабочий e-mail, мы отправим письмо для подтверждения доступа в WELLIFY business.";
    } else {
      // для шага 3 описание убираем, чтобы не дублировать текст про подтверждение телефона
      descriptionText = null;
    }

    return (
      <>
        <CardTitle className="text-center text-[22px] font-semibold tracking-tight text-zinc-50">
          Создать аккаунт директора
        </CardTitle>
        {descriptionText && (
          <CardDescription className="mt-2 text-center text-sm leading-relaxed text-zinc-400">
            {descriptionText}
          </CardDescription>
        )}
      </>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1.5 md:col-span-1">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Имя
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <User className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              type="text"
              className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
              value={personal.firstName}
              onChange={handlePersonalChange("firstName")}
            />
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-1">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Отчество
          </label>
          <div className="relative">
            <input
              type="text"
              className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
              value={personal.middleName}
              onChange={handlePersonalChange("middleName")}
            />
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-1">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Фамилия
          </label>
          <div className="relative">
            <input
              type="text"
              className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
              value={personal.lastName}
              onChange={handlePersonalChange("lastName")}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Дата рождения
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Calendar className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              type="date"
              className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
              value={personal.birthDate}
              onChange={handlePersonalChange("birthDate")}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Пароль
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Lock className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 pl-9 pr-10 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
              placeholder="От 8 символов"
              value={personal.password}
              onChange={handlePersonalChange("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
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
            Подтверждение пароля
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
              placeholder="Повторите пароль"
              value={personal.passwordConfirm}
              onChange={handlePersonalChange("passwordConfirm")}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <form id="step2-form" className="space-y-5" onSubmit={handleSubmitStep2}>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Рабочий e-mail
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Mail className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="email"
            autoComplete="email"
            className={`
              h-10 w-full rounded-2xl border bg-zinc-950/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors
              ${emailExistsError 
                ? "border-rose-600/80 focus:border-rose-500" 
                : "border-zinc-800/80 focus:border-[var(--accent-primary,#3b82f6)]"
              }
            `}
            placeholder="you@business.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailExistsError) {
                setEmailExistsError(false);
                setRegisterError(null);
              }
            }}
          />
        </div>
        {emailExistsError && (
          <p className="text-xs text-rose-400 mt-1">
            Этот e-mail уже зарегистрирован.
          </p>
        )}
      </div>

      {emailExistsError && (
        <div className="mt-2 flex flex-col gap-2 text-xs">
          <p className="text-zinc-400">
            Вы можете войти в аккаунт или восстановить пароль.
          </p>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="text-[var(--accent-primary,#3b82f6)] hover:underline font-medium"
            >
              Войти
            </Link>
            <span className="text-zinc-600">•</span>
            <Link
              href="/forgot-password"
              className="text-[var(--accent-primary,#3b82f6)] hover:underline font-medium"
            >
              Забыли пароль?
            </Link>
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-col gap-1 text-xs text-zinc-500">
        {!emailExistsError && (
          <p>
            Этот адрес будет использоваться для входа, уведомлений по сменам и
            восстановления доступа.
          </p>
        )}
        {emailStatus === "link_sent" && !emailExistsError && (
          <p className="text-emerald-400">
            Письмо с подтверждением отправлено. Перейдите по ссылке в письме,
            после чего мы автоматически продолжим регистрацию.
          </p>
        )}
        {emailStatus === "verified" && !emailExistsError && (
          <p className="text-emerald-400">
            E-mail подтвержден. Можно переходить к шагу Telegram.
          </p>
        )}
      </div>
    </form>
  );

  const renderStep3 = () => {
    if (!registeredUserId || !registeredUserEmail) {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-2xl border border-rose-800/80 bg-rose-950/80 px-4 py-3 text-xs text-rose-50">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>
              Не удалось получить данные регистрации. Вернитесь на шаг 2,
              отправьте письмо ещё раз и подтвердите e-mail по ссылке из
              письма.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <TelegramVerificationStep
          onVerified={handleTelegramVerified}
          language={localeForAPI as "ru" | "uk" | "en"}
          userId={registeredUserId}
          email={registeredUserEmail}
        />
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-zinc-50">
          Регистрация завершена успешно!
        </h3>
        <p className="max-w-md text-sm text-zinc-400">
          Все данные подтверждены. Теперь вы можете перейти в дашборд и начать работу с WELLIFY business.
        </p>
      </div>
      <Button
        onClick={finishRegistration}
        disabled={isSubmitting}
        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary,#2563eb)] px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Переход в дашборд...
          </>
        ) : (
          <>
            Перейти в дашборд
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );

  // ---------- main render ----------

  return (
    <main className="min-h-screen pt-[112px] pb-12 flex items-center justify-center bg-background px-4">
      <div className="relative w-full max-w-xl">
        <Card className="relative z-10 w-full rounded-[32px] border border-border bg-card shadow-modal backdrop-blur-2xl">
          <CardHeader className="px-10 pt-7 pb-4">
            {renderTabs()}
            {renderStepTitle()}
          </CardHeader>

          <CardContent className="px-10 pb-4 pt-1">
            {registerError && (
              <div className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-800/80 bg-rose-950/80 px-4 py-3 text-xs text-rose-50">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{registerError}</span>
              </div>
            )}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </CardContent>

          <CardFooter className="relative flex items-center justify-between px-10 pb-6 pt-2 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              {step > 1 && step < 4 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/70 bg-zinc-900/80 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800/80 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </button>
              )}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center text-[11px]">
              <span className="text-zinc-500">Уже есть аккаунт? </span>
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="ml-1 font-medium text-zinc-200 underline-offset-4 hover:underline"
              >
                Войти
              </button>
            </div>
            <div className="flex items-center gap-2">
              {step === 1 && (
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary,#2563eb)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors"
                >
                  Далее
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {step === 2 && !emailExistsError && (
                <button
                  type="button"
                  onClick={() => {
                    const form = document.getElementById(
                      "step2-form"
                    ) as HTMLFormElement | null;
                    if (form) {
                      form.requestSubmit();
                    }
                  }}
                  disabled={
                    isSubmitting ||
                    emailStatus === "sending" ||
                    emailStatus === "link_sent"
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary,#2563eb)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting || emailStatus === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Отправляем...
                    </>
                  ) : emailStatus === "link_sent" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ожидание...
                    </>
                  ) : (
                    <>
                      Далее
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
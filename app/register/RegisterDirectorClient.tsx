"use client";

import { useState, useEffect, ChangeEvent } from "react";
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

type Step = 1 | 2 | 3;

interface PersonalForm {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
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
    email: "",
    birthDate: "",
    password: "",
    passwordConfirm: "",
  });

  const [registerError, setRegisterError] = useState<string | null>(null);
  const [emailExistsError, setEmailExistsError] = useState(false);

  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [registeredUserEmail, setRegisteredUserEmail] = useState<string | null>(
    null
  );
  const [registeredUserPhone, setRegisteredUserPhone] = useState<string | null>(
    null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Шаг 3: состояние готовности данных
  const [step3DataReady, setStep3DataReady] = useState(false);
  const [step3Polling, setStep3Polling] = useState(false);

  // Показ/скрытие пароля
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [supabase] = useState(() => createBrowserSupabaseClient());

  const localeForAPI =
    language === "ua" ? "uk" : (language as "ru" | "uk" | "en" | string);

  // Функция для сброса регистрации
  const resetRegistration = () => {
    console.log("[register] Resetting registration");
    setRegisteredUserId(null);
    setRegisteredUserEmail(null);
    setRegisteredUserPhone(null);
    setStep(1);
    setMaxStepReached(1);
    setRegisterError(null);
    setEmailExistsError(false);
    
    // Очищаем localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("wellify_registration_userId");
      localStorage.removeItem("wellify_registration_email");
    }
  };

  // ---------- Очистка localStorage при монтировании (сброс при обновлении страницы) ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    localStorage.removeItem("wellify_registration_userId");
    localStorage.removeItem("wellify_registration_email");
    
    console.log("[register] Page loaded - registration state reset");
  }, []);

  // ---------- helpers ----------

  const handlePersonalChange =
    (field: keyof PersonalForm) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setPersonal((prev) => ({ ...prev, [field]: e.target.value }));
      if (emailExistsError && field === "email") {
        setEmailExistsError(false);
        setRegisterError(null);
      }
    };

  const handleNextFromStep1 = async () => {
    setRegisterError(null);
    setEmailExistsError(false);

    if (!personal.firstName.trim() || !personal.lastName.trim()) {
      setRegisterError("Укажите имя и фамилию директора.");
      return;
    }

    if (!personal.email.trim()) {
      setRegisterError("Укажите рабочий e-mail.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personal.email.trim())) {
      setRegisterError("Введите корректный e-mail адрес.");
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
    setIsSubmitting(true);

    try {
      const fullName = [
        personal.firstName.trim(),
        personal.middleName.trim(),
        personal.lastName.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      // Создаем пользователя в Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: personal.email.trim().toLowerCase(),
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
        },
      });

      // Проверка на существующий email
      if (error) {
        const msg = error.message?.toLowerCase() || "";
        if (
          msg.includes("already") ||
          msg.includes("exists") ||
          msg.includes("registered") ||
          msg.includes("user already registered") ||
          msg.includes("email already exists")
        ) {
          setEmailExistsError(true);
          setRegisterError("Этот e-mail уже зарегистрирован. Войдите в аккаунт или восстановите пароль.");
          return;
        }
        setRegisterError(error.message || "Не удалось создать учетную запись. Попробуйте ещё раз.");
        return;
      }

      if (!data?.user) {
        setRegisterError("Не удалось создать учетную запись. Попробуйте ещё раз.");
        return;
      }

      // Проверка: если identities пустой массив - email уже зарегистрирован
      if (data.user.identities && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setEmailExistsError(true);
        setRegisterError("Этот e-mail уже зарегистрирован. Войдите в аккаунт или восстановите пароль.");
        return;
      }

      const userId = data.user.id;
      const userEmail = data.user.email ?? personal.email.trim();

      // Принудительный выход после signUp (предотвращает race condition)
      await supabase.auth.signOut();

      setRegisteredUserId(userId);
      setRegisteredUserEmail(userEmail);
      
      // Переходим на шаг 2 (Telegram)
      setStep(2);
      setMaxStepReached(2);
    } catch (err) {
      console.error("[register] handleNextFromStep1 error", err);
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
    return false;
  };

  const finishRegistration = async () => {
    try {
      setIsSubmitting(true);
      setRegisterError(null);

      // Проверяем наличие сессии пользователя
      let session = (await supabase.auth.getSession()).data.session;
      
      // Если нет сессии, восстанавливаем через signInWithPassword
      if (!session && registeredUserEmail && personal.password) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: registeredUserEmail,
          password: personal.password,
        });

        if (signInError) {
          console.warn("[register] signIn error", signInError);
          setRegisterError(
            "Не удалось восстановить сессию. Попробуйте войти вручную."
          );
          return;
        }

        session = signInData?.session || null;
      }

      if (!session) {
        setRegisterError("Сессия истекла. Пожалуйста, войдите заново.");
        return;
      }

      // Загружаем профиль из БД через /api/auth/load-profile
      const res = await fetch('/api/auth/load-profile', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        setRegisterError("Сессия истекла. Пожалуйста, войдите заново.");
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[register] Load profile error:", res.status, errorData);
        setRegisterError(
          "Не удалось загрузить данные профиля. Попробуйте позже."
        );
        return;
      }

      const data = await res.json();

      if (!data.success || !data.user) {
        setRegisterError("Профиль не найден. Попробуйте войти заново.");
        return;
      }

      const profile = data.user;

      // Проверяем два условия
      // Условие 1: phone должен быть заполнен
      if (!profile?.phone || profile.phone.trim() === "") {
        setRegisterError("Номер телефона не подтвержден. Пожалуйста, завершите верификацию Telegram.");
        return;
      }

      // Условие 2: telegram_verified должен быть true
      const isTelegramVerified = profile?.telegram_verified === true || 
                                 profile?.telegram_verified === "true" || 
                                 profile?.telegram_verified === 1;
      
      if (!isTelegramVerified) {
        setRegisterError("Telegram не подтвержден. Пожалуйста, завершите верификацию Telegram.");
        return;
      }

      // Если оба условия выполнены → переход в дашборд
      console.log("[register] ✅ All conditions met, redirecting to dashboard");
      
      // Очищаем localStorage после успешной регистрации
      if (typeof window !== "undefined") {
        localStorage.removeItem("wellify_registration_userId");
        localStorage.removeItem("wellify_registration_email");
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
    // Переходим на шаг 3 - успешное завершение
    setRegisterError(null);
    setStep3DataReady(false);
    setStep3Polling(false);
    setStep(3);
    setMaxStepReached(3);
  };

  // ---------- Polling для шага 3: проверка готовности данных Telegram ----------
  useEffect(() => {
    // Запускаем polling только на шаге 3
    if (step !== 3) {
      return;
    }

    setRegisterError(null);

    console.log("[register] ✅ Starting step 3 polling for Telegram data readiness");

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const check = async () => {
      if (cancelled) {
        console.log("[register] Step 3 polling cancelled");
        return;
      }

      try {
        // Проверяем сессию через supabase.auth.getSession()
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData?.session) {
          console.log("[register] Step 3: No session yet, waiting...");
          return;
        }

        // Используем /api/auth/load-profile с credentials: 'include'
        const res = await fetch('/api/auth/load-profile', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.status === 401) {
          console.log("[register] Step 3: 401 Unauthorized, session not ready yet, waiting...");
          return;
        }

        if (!res.ok) {
          console.warn("[register] Step 3: Load profile failed, status:", res.status);
          return;
        }

        const data = await res.json();

        if (!data.success || !data.user) {
          console.log("[register] Step 3: Profile not loaded yet, waiting...");
          return;
        }

        const profile = data.user;

        // Проверяем два условия
        const hasPhone = profile?.phone && profile.phone.trim() !== "";
        const isTelegramVerified = profile?.telegram_verified === true || 
                                   profile?.telegram_verified === "true" || 
                                   profile?.telegram_verified === 1;

        console.log("[register] Step 3: Check result:", {
          hasPhone,
          isTelegramVerified,
          phone: profile?.phone,
          telegram_verified: profile?.telegram_verified,
        });

        if (hasPhone && isTelegramVerified) {
          console.log("[register] ✅ Step 3: Data ready! Phone and Telegram verified");
          setStep3DataReady(true);
          setRegisterError(null);
          
          // Останавливаем polling
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        } else {
          if (!step3Polling) {
            setStep3Polling(true);
          }
        }
      } catch (e) {
        console.error("[register] Step 3 polling error:", e);
      }
    };

    // Первая проверка через 1.5 секунды
    timeoutId = setTimeout(() => {
      check();
      // Затем проверяем каждые 2 секунды
      intervalId = setInterval(check, 2000);
    }, 1500);

    return () => {
      console.log("[register] Cleaning up step 3 polling");
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, [step, supabase, step3Polling]);

  // ---------- render helpers ----------

  const renderTabs = () => {
    const tabs: { id: Step; label: string }[] = [
      { id: 1, label: "Основные данные" },
      { id: 2, label: "Telegram" },
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
        "Укажите личные данные директора, e-mail и задайте пароль для входа.";
    } else {
      // для шага 2 описание убираем, чтобы не дублировать текст про подтверждение телефона
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
            value={personal.email}
            onChange={handlePersonalChange("email")}
          />
        </div>
        {emailExistsError && (
          <div className="mt-3 flex flex-col gap-2 text-xs">
            <div className="flex gap-3">
              <Link
                href="/auth/login"
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
        <p className="mt-2 text-xs text-zinc-500">
          Этот адрес будет использоваться для входа, уведомлений по сменам и
          восстановления доступа.
        </p>
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
              type={showPasswordConfirm ? "text" : "password"}
              autoComplete="new-password"
              className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-3 pr-10 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
              placeholder="Повторите пароль"
              value={personal.passwordConfirm}
              onChange={handlePersonalChange("passwordConfirm")}
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
              tabIndex={-1}
            >
              {showPasswordConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (!registeredUserId || !registeredUserEmail) {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-2xl border border-rose-800/80 bg-rose-950/80 px-4 py-3 text-xs text-rose-50">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>
              Не удалось получить данные регистрации. Вернитесь на шаг 1 и попробуйте ещё раз.
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

  const renderStep3 = () => {
    const showWaitingMessage = step3Polling && !step3DataReady;
    
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-zinc-50">
            {step3DataReady 
              ? "Регистрация завершена успешно!" 
              : "Завершение регистрации..."}
          </h3>
          <p className="max-w-md text-sm text-zinc-400">
            {step3DataReady
              ? "Все данные подтверждены. Теперь вы можете перейти в дашборд и начать работу с WELLIFY business."
              : "Ожидаем подтверждения данных Telegram..."}
          </p>
        </div>
        
        {showWaitingMessage && (
          <div className="mt-2 flex items-start gap-2 rounded-2xl border border-blue-800/80 bg-blue-950/80 px-4 py-3 text-xs text-blue-50 max-w-md">
            <Loader2 className="mt-0.5 h-4 w-4 animate-spin" />
            <span>Ожидание подтверждения данных Telegram...</span>
          </div>
        )}

        <Button
          onClick={finishRegistration}
          disabled={isSubmitting || !step3DataReady}
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
  };

  // ---------- main render ----------

  return (
    <main className="min-h-screen pt-[112px] pb-12 flex items-center justify-center bg-background px-4">
      <div className="relative w-full max-w-[640px]">
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
          </CardContent>

          <CardFooter className="relative flex items-center justify-between px-10 pb-6 pt-2 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              {step > 1 && step < 3 && (
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
              <Link
                href="/auth/login"
                className="ml-1 font-medium text-zinc-200 underline-offset-4 hover:underline"
              >
                Войти
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {step === 1 && (
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary,#2563eb)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Создание аккаунта...
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

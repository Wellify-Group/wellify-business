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

  // Шаг 4: состояние готовности данных
  const [step4DataReady, setStep4DataReady] = useState(false);
  const [step4Polling, setStep4Polling] = useState(false);

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
    setEmail("");
    setEmailStatus("idle");
    setEmailVerified(false);
    setStep(1);
    setMaxStepReached(1);
    setRegisterError(null);
    setEmailExistsError(false);
    
    // Очищаем localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("wellify_registration_userId");
      localStorage.removeItem("wellify_registration_email");
      localStorage.removeItem("wellify_email_confirmed");
    }
  };

  // ---------- Очистка localStorage при монтировании (сброс при обновлении страницы) ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // При обновлении страницы очищаем все данные регистрации из localStorage
    // Это обеспечивает полный сброс при обновлении страницы
    localStorage.removeItem("wellify_registration_userId");
    localStorage.removeItem("wellify_registration_email");
    localStorage.removeItem("wellify_email_confirmed");
    
    console.log("[register] Page loaded - registration state reset");
  }, []); // Только при монтировании

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

    // Валидация
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

    if (!personal.firstName.trim() || !personal.lastName.trim() || !personal.password) {
      setRegisterError("Пожалуйста, заполните личные данные и пароль на шаге 1.");
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

      // НОВАЯ ТАКТИКА: Создаем пользователя БЕЗ подтверждения email через Supabase
      // Затем генерируем кастомный токен и отправляем письмо через наш API
      // НЕ передаем emailRedirectTo, чтобы Supabase не отправлял стандартное письмо
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: personal.password,
        options: {
          // ВАЖНО: Не передаем emailRedirectTo - мы сами отправляем письмо через Resend
          // Передаем только метаданные пользователя
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
          setMaxStepReached(2);
          setEmailStatus("idle");
          return;
        }
        setRegisterError(error.message || "Не удалось создать учетную запись. Попробуйте ещё раз.");
        setEmailStatus("error");
        return;
      }

      if (!data?.user) {
        setRegisterError("Не удалось создать учетную запись. Попробуйте ещё раз.");
        setEmailStatus("error");
        return;
      }

      // Проверка: если identities пустой массив - email уже зарегистрирован
      if (data.user.identities && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setEmailExistsError(true);
        setRegisterError("Этот e-mail уже зарегистрирован. Войдите в аккаунт или восстановите пароль.");
        setMaxStepReached(2);
        setEmailStatus("idle");
        return;
      }

      const userId = data.user.id;
      const userEmail = data.user.email ?? email.trim();

      // НОВАЯ ТАКТИКА: Отправляем кастомное письмо через наш API
      try {
        const emailResponse = await fetch('/api/auth/send-custom-email-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            email: userEmail,
            firstName: personal.firstName.trim(),
            lastName: personal.lastName.trim(),
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json().catch(() => ({}));
          console.error('[register] Failed to send custom email:', errorData);
          setRegisterError("Не удалось отправить письмо. Попробуйте ещё раз позже.");
          setEmailStatus("error");
          return;
        }

        // Принудительный выход после signUp (предотвращает race condition)
        await supabase.auth.signOut();

        setRegisteredUserId(userId);
        setRegisteredUserEmail(userEmail);
        setEmailStatus("link_sent");
      } catch (emailError) {
        console.error('[register] Error sending custom email:', emailError);
        setRegisterError("Не удалось отправить письмо. Попробуйте ещё раз позже.");
        setEmailStatus("error");
        return;
      }
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

      // По INTERNAL_RULES.md: проверяем наличие сессии пользователя
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

      // По INTERNAL_RULES.md: загружаем профиль из БД через /api/auth/load-profile
      const res = await fetch('/api/auth/load-profile', {
        credentials: 'include',
        cache: 'no-store',
      });

      // По INTERNAL_RULES.md: обработка 401 - показываем ошибку
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

      // По INTERNAL_RULES.md: проверяем два условия
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

      // По INTERNAL_RULES.md: если оба условия выполнены → переход в дашборд
      console.log("[register] ✅ All conditions met, redirecting to dashboard");
      
      // Очищаем localStorage после успешной регистрации
      if (typeof window !== "undefined") {
        localStorage.removeItem("wellify_registration_userId");
        localStorage.removeItem("wellify_registration_email");
        localStorage.removeItem("wellify_email_confirmed");
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
    // По INTERNAL_RULES.md: при переходе на шаг 4 сразу очищаются ошибки
    setRegisterError(null);
    setStep4DataReady(false);
    setStep4Polling(false);
    setStep(4);
    setMaxStepReached(4);
  };

  // ---------- polling e-mail confirmation ----------
  // Проверяем email_verified в profiles через API
  useEffect(() => {
    if (emailStatus !== "link_sent" || !registeredUserEmail) {
      return;
    }

    if (emailVerified) {
      return; // Уже подтвержден, не нужно проверять
    }

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    const check = async () => {
      if (cancelled) return;

      try {
        const url = `/api/auth/check-email-confirmed?email=${encodeURIComponent(registeredUserEmail || email.trim())}`;
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) return;

        const data = await res.json();

        // Проверяем emailVerified из profiles (синхронизируется триггером)
        const isVerified = data.success && data.emailVerified === true;

        if (isVerified && !cancelled) {
          setEmailStatus("verified");
          setEmailVerified(true);
          setRegisterError(null);
          setMaxStepReached((prev) => (prev < 3 ? 3 : prev));

          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (e) {
        console.error("[register] Polling check error:", e);
      }
    };

    // Первая проверка сразу
    check();
    // Затем каждые 1.5 секунды
    intervalId = setInterval(check, 1500);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [emailStatus, registeredUserEmail, emailVerified, email]);

  // ---------- Polling для шага 4: проверка готовности данных Telegram ----------
  // По INTERNAL_RULES.md: автоматическая проверка данных на шаге 4
  useEffect(() => {
    // Запускаем polling только на шаге 4
    if (step !== 4) {
      return;
    }

    // По INTERNAL_RULES.md: при переходе на шаг 4 сразу очищаются ошибки
    setRegisterError(null);

    console.log("[register] ✅ Starting step 4 polling for Telegram data readiness");

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const check = async () => {
      if (cancelled) {
        console.log("[register] Step 4 polling cancelled");
        return;
      }

      try {
        // По INTERNAL_RULES.md: проверяем сессию через supabase.auth.getSession()
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        // По INTERNAL_RULES.md: если нет сессии или ошибка - просто ждем, ошибку не показываем
        if (sessionError || !sessionData?.session) {
          console.log("[register] Step 4: No session yet, waiting...");
          return;
        }

        // По INTERNAL_RULES.md: используем /api/auth/load-profile с credentials: 'include'
        const res = await fetch('/api/auth/load-profile', {
          credentials: 'include',
          cache: 'no-store',
        });

        // По INTERNAL_RULES.md: 401 ошибка - не показываем ошибку, просто ждем
        if (res.status === 401) {
          console.log("[register] Step 4: 401 Unauthorized, session not ready yet, waiting...");
          return;
        }

        if (!res.ok) {
          // По INTERNAL_RULES.md: другие ошибки логируются, но не показываются
          console.warn("[register] Step 4: Load profile failed, status:", res.status);
          return;
        }

        const data = await res.json();

        if (!data.success || !data.user) {
          console.log("[register] Step 4: Profile not loaded yet, waiting...");
          return;
        }

        const profile = data.user;

        // По INTERNAL_RULES.md: проверяем два условия
        const hasPhone = profile?.phone && profile.phone.trim() !== "";
        const isTelegramVerified = profile?.telegram_verified === true || 
                                   profile?.telegram_verified === "true" || 
                                   profile?.telegram_verified === 1;

        console.log("[register] Step 4: Check result:", {
          hasPhone,
          isTelegramVerified,
          phone: profile?.phone,
          telegram_verified: profile?.telegram_verified,
        });

        if (hasPhone && isTelegramVerified) {
          // По INTERNAL_RULES.md: данные готовы
          console.log("[register] ✅ Step 4: Data ready! Phone and Telegram verified");
          setStep4DataReady(true);
          setRegisterError(null); // Убираем любое сообщение
          
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
          // По INTERNAL_RULES.md: данные не готовы - показываем информационное сообщение
          // Сообщение отображается в renderStep4, здесь только включаем polling
          if (!step4Polling) {
            setStep4Polling(true);
            // Не используем setRegisterError для информационного сообщения
            // Оно отображается отдельно в renderStep4 синим цветом
          }
        }
      } catch (e) {
        // По INTERNAL_RULES.md: ошибки логируются, но не показываются
        console.error("[register] Step 4 polling error:", e);
      }
    };

    // По INTERNAL_RULES.md: первая проверка через 1.5 секунды (дает время БД обновиться)
    timeoutId = setTimeout(() => {
      check();
      // Затем проверяем каждые 2 секунды
      intervalId = setInterval(check, 2000);
    }, 1500);

    return () => {
      console.log("[register] Cleaning up step 4 polling");
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
  }, [step, supabase, step4Polling]);

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
            Этот e-mail уже зарегистрирован. Войдите в аккаунт или восстановите пароль.
          </p>
        )}
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

      <div className="mt-2 flex flex-col gap-1 text-xs text-zinc-500">
        {!emailExistsError && (
          <p>
            Этот адрес будет использоваться для входа, уведомлений по сменам и
            восстановления доступа.
          </p>
        )}
        {emailStatus === "link_sent" && !emailVerified && !emailExistsError && (
          <p className="text-emerald-400">
            Письмо с подтверждением отправлено. Перейдите по ссылке в письме.
          </p>
        )}
        {emailStatus === "verified" && emailVerified && !emailExistsError && (
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

  const renderStep4 = () => {
    // По INTERNAL_RULES.md: показываем информационное сообщение если данные не готовы
    const showWaitingMessage = step4Polling && !step4DataReady;
    
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-zinc-50">
            {step4DataReady 
              ? "Регистрация завершена успешно!" 
              : "Завершение регистрации..."}
          </h3>
          <p className="max-w-md text-sm text-zinc-400">
            {step4DataReady
              ? "Все данные подтверждены. Теперь вы можете перейти в дашборд и начать работу с WELLIFY business."
              : "Ожидаем подтверждения данных Telegram..."}
          </p>
        </div>
        
        {/* По INTERNAL_RULES.md: информационное сообщение (синий цвет) если данные не готовы */}
        {showWaitingMessage && (
          <div className="mt-2 flex items-start gap-2 rounded-2xl border border-blue-800/80 bg-blue-950/80 px-4 py-3 text-xs text-blue-50 max-w-md">
            <Loader2 className="mt-0.5 h-4 w-4 animate-spin" />
            <span>Ожидание подтверждения данных Telegram...</span>
          </div>
        )}

        <Button
          onClick={finishRegistration}
          disabled={isSubmitting || !step4DataReady}
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
                    // !!! ИСПРАВЛЕНИЕ: Если email подтвержден - переходим на шаг 3, иначе отправляем письмо
                    if (emailVerified) {
                      setStep(3);
                    } else {
                      // Вызываем отправку формы, как и раньше
                      const form = document.getElementById(
                        "step2-form"
                      ) as HTMLFormElement | null;
                      if (form) {
                        form.requestSubmit();
                      }
                    }
                  }}
                  disabled={
                    isSubmitting ||
                    emailStatus === "sending" ||
                    (emailStatus === "link_sent" && !emailVerified) // Блокируем, пока не подтверждено
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary,#2563eb)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {emailVerified ? (
                    <>
                      Далее
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : isSubmitting || emailStatus === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Отправляем...
                    </>
                  ) : emailStatus === "link_sent" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ждём подтверждения…
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
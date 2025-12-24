"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
import { EmailVerificationCode } from "@/components/auth/email-verification-code";

type Step = 1 | 2 | 3 | 4;

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
  const { language, t } = useLanguage();

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
  
  // Состояние для шага 2: ввод email или ввод кода
  const [step2Email, setStep2Email] = useState<string>('');
  const [step2CodeSent, setStep2CodeSent] = useState(false);
  const [step2Code, setStep2Code] = useState(['', '', '', '', '', '']);
  const [step2IsLoading, setStep2IsLoading] = useState(false);
  const [step2IsResending, setStep2IsResending] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Шаг 3: состояние готовности данных
  const [step3DataReady, setStep3DataReady] = useState(false);
  const [step3Polling, setStep3Polling] = useState(false);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);

  // Показ/скрытие пароля
  const [showPassword, setShowPassword] = useState(false);

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
      setRegisterError(t<string>("register_error_name_required"));
      return;
    }

    if (!personal.birthDate) {
      setRegisterError(t<string>("register_error_birth_date_required"));
      return;
    }

    if (!personal.password || personal.password.length < 8) {
      setRegisterError(t<string>("register_error_password_min"));
      return;
    }

    if (personal.password !== personal.passwordConfirm) {
      setRegisterError(t<string>("register_error_password_mismatch"));
      return;
    }

    setRegisterError(null);
    setIsSubmitting(true);

    try {
      // На шаге 1 только сохраняем данные, пользователь будет создан на шаге 2 после ввода email
      // Переходим на шаг 2 (ввод email)
      setStep(2);
      setMaxStepReached(2);
    } catch (err) {
      console.error("[register] handleNextFromStep1 error", err);
      setRegisterError(t<string>("register_error_internal"));
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
    if (target === 3) return maxStepReached >= 3;
    if (target === 4) return maxStepReached >= 4;
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
          setRegisterError(t<string>("register_error_session_restore_failed"));
          return;
        }

        session = signInData?.session || null;
      }

      if (!session) {
        setRegisterError(t<string>("register_error_session_expired"));
        return;
      }

      // Загружаем профиль из БД через /api/auth/load-profile
      const res = await fetch('/api/auth/load-profile', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        setRegisterError(t<string>("register_error_session_expired"));
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[register] Load profile error:", res.status, errorData);
        setRegisterError(t<string>("register_error_profile_load_failed"));
        return;
      }

      const data = await res.json();

      if (!data.success || !data.user) {
        setRegisterError(t<string>("register_error_profile_not_found"));
        return;
      }

      const profile = data.user;

      // Проверяем два условия
      // Условие 1: phone должен быть заполнен
      if (!profile?.phone || profile.phone.trim() === "") {
        setRegisterError(t<string>("register_error_phone_not_verified"));
        return;
      }

      // Условие 2: telegram_verified должен быть true
      const isTelegramVerified = profile?.telegram_verified === true || 
                                 profile?.telegram_verified === "true" || 
                                 profile?.telegram_verified === 1;
      
      if (!isTelegramVerified) {
        setRegisterError(t<string>("register_error_telegram_not_verified"));
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
      setRegisterError(t<string>("register_error_finish_registration_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Отправка кода на шаге 2
  const handleStep2SendCode = async () => {
    if (!step2Email.trim()) {
      setStep2Error(t<string>("register_error_email_required"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(step2Email.trim())) {
      setStep2Error(t<string>("register_error_email_invalid"));
      return;
    }

    setStep2IsLoading(true);
    setStep2Error(null);

    try {
      // Если пользователь еще не создан, создаем его
      if (!registeredUserId) {
        const fullName = [
          personal.firstName.trim(),
          personal.middleName.trim(),
          personal.lastName.trim(),
        ]
          .filter(Boolean)
          .join(" ");

        const createUserResponse = await fetch('/api/auth/create-user-without-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: step2Email.trim().toLowerCase(),
            password: personal.password,
            first_name: personal.firstName.trim(),
            last_name: personal.lastName.trim(),
            middle_name: personal.middleName.trim() || null,
            full_name: fullName || null,
            birth_date: personal.birthDate || null,
            locale: localeForAPI,
          }),
        });

        const createUserData = await createUserResponse.json();

        if (!createUserData.success || !createUserData.user) {
          const errorMessage = createUserData.error || t<string>("register_error_account_creation_failed");
          
          // Проверка на существующий email
          if (errorMessage.toLowerCase().includes('already') || 
              errorMessage.toLowerCase().includes('exists') ||
              errorMessage.toLowerCase().includes('registered')) {
            setStep2Error(t<string>("register_error_email_already_registered_with_recovery"));
            return;
          }
          
          setStep2Error(errorMessage);
          return;
        }

        const userId = createUserData.user.id;
        const userEmail = createUserData.user.email ?? step2Email.trim().toLowerCase();

        setRegisteredUserId(userId);
        setRegisteredUserEmail(userEmail);
      }

      // Отправляем код подтверждения
      const sendCodeResponse = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: step2Email.trim().toLowerCase(),
          userId: registeredUserId,
        }),
      });

      const sendCodeData = await sendCodeResponse.json();
      
      if (!sendCodeData.success) {
        setStep2Error(sendCodeData.error || t<string>("register_error_code_send_failed"));
        return;
      }

      setStep2CodeSent(true);
      setRegisteredUserEmail(step2Email.trim().toLowerCase());
      setStep2Code(['', '', '', '', '', '']);
      // Фокус на первое поле кода
      setTimeout(() => {
        document.getElementById('step2-code-0')?.focus();
      }, 100);
    } catch (error) {
      console.error('Error sending verification code:', error);
      setStep2Error(t<string>("register_error_code_send_failed"));
    } finally {
      setStep2IsLoading(false);
    }
  };

  // Изменение email на шаге 2
  const handleStep2ChangeEmail = () => {
    setStep2CodeSent(false);
    setStep2Code(['', '', '', '', '', '']);
    setStep2Error(null);
  };

  // Повторная отправка кода
  const handleStep2ResendCode = async () => {
    setStep2IsResending(true);
    setStep2Error(null);

    try {
      const sendCodeResponse = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: step2Email.trim().toLowerCase(),
          userId: registeredUserId,
        }),
      });

      const sendCodeData = await sendCodeResponse.json();
      
      if (!sendCodeData.success) {
        setStep2Error(sendCodeData.error || t<string>("register_error_code_send_failed"));
        return;
      }

      setStep2Code(['', '', '', '', '', '']);
      setStep2Error(null);
      // Фокус на первое поле кода
      setTimeout(() => {
        document.getElementById('step2-code-0')?.focus();
      }, 100);
    } catch (error) {
      console.error('Error resending verification code:', error);
      setStep2Error(t<string>("register_error_code_send_failed"));
    } finally {
      setStep2IsResending(false);
    }
  };

  // Проверка кода на шаге 2
  const handleStep2VerifyCode = async () => {
    const codeString = step2Code.join('');
    
    if (codeString.length !== 6) {
      setStep2Error(t<string>("register_error_code_incomplete"));
      return;
    }

    setStep2IsLoading(true);
    setStep2Error(null);

    try {
      const response = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: step2Email.trim().toLowerCase(),
          code: codeString,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Email подтвержден, восстанавливаем сессию и переходим на шаг 3 (Telegram)
        if (registeredUserEmail && personal.password) {
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: registeredUserEmail,
              password: personal.password,
            });

            if (signInError) {
              console.error('[register] Sign in after email verification error:', signInError);
              setStep2Error(t<string>("register_error_session_restore_failed"));
              return;
            }

            console.log('[register] ✅ Session restored after email verification');
          } catch (error) {
            console.error('[register] Error restoring session:', error);
            setStep2Error(t<string>("register_error_session_restore_failed"));
            return;
          }
        }
        
        setStep(3);
        setMaxStepReached(3);
      } else {
        // Всегда используем перевод, игнорируя текст ошибки от API
        setStep2Error(t<string>("register_error_code_invalid"));
        setStep2Code(['', '', '', '', '', '']);
        document.getElementById('step2-code-0')?.focus();
      }
    } catch (error: any) {
      setStep2Error(t<string>("register_error_code_verify_failed"));
      console.error('Verify code error:', error);
    } finally {
      setStep2IsLoading(false);
    }
  };

  const handleEmailVerified = async () => {
    // Эта функция больше не используется, но оставляем для совместимости
    setStep(3);
    setMaxStepReached(3);
  };

  const handleTelegramVerified = async (phone?: string) => {
    // Сохраняем phone если передан
    if (phone) {
      setRegisteredUserPhone(phone);
    }
    
    // Показываем поздравительное сообщение
    setRegisterError(null);
    setRegistrationCompleted(true);
    
    // Очищаем localStorage после успешной регистрации
    if (typeof window !== "undefined") {
      localStorage.removeItem("wellify_registration_userId");
      localStorage.removeItem("wellify_registration_email");
    }

    console.log("[register] ✅ Telegram verified, registration completed");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard/director");
  };

  // ---------- Polling для шага 4: проверка готовности данных Telegram ----------
  useEffect(() => {
    // Запускаем polling только на шаге 4
    if (step !== 4) {
      return;
    }

    setRegisterError(null);

    console.log("[register] ✅ Starting step 4 polling for Telegram data readiness");

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
          console.log("[register] Step 4: No session yet, waiting...");
          return;
        }

        // Используем /api/auth/load-profile с credentials: 'include'
        const res = await fetch('/api/auth/load-profile', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.status === 401) {
          console.log("[register] Step 4: 401 Unauthorized, session not ready yet, waiting...");
          return;
        }

        if (!res.ok) {
          console.warn("[register] Step 4: Load profile failed, status:", res.status);
          return;
        }

        const data = await res.json();

        if (!data.success || !data.user) {
          console.log("[register] Step 4: Profile not loaded yet, waiting...");
          return;
        }

        const profile = data.user;

        // Проверяем два условия
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
          console.log("[register] ✅ Step 4: Data ready! Phone and Telegram verified");
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
  }, [step, supabase, step3Polling]);

  // ---------- render helpers ----------

  const renderTabs = () => {
    const tabs: { id: Step; label: string }[] = [
      { id: 1, label: "Основные данные" },
      { id: 2, label: "Email" },
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
        "Укажите личные данные директора, e-mail и задайте пароль для входа.";
    } else {
      // для остальных шагов описание убираем
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

  const handleStep2CodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newCode = [...step2Code];
    newCode[index] = value;
    setStep2Code(newCode);
    setStep2Error(null);

    if (value && index < 5) {
      const nextInput = document.getElementById(`step2-code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleStep2CodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !step2Code[index] && index > 0) {
      const prevInput = document.getElementById(`step2-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleStep2CodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      setStep2Code(pastedData.split(''));
      setStep2Error(null);
      document.getElementById('step2-code-5')?.focus();
    }
  };

  const renderStep2 = () => {
    return (
      <div className="space-y-6">
        {!step2CodeSent ? (
          // Ввод email
          <div className="space-y-4">
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
                  className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
                  placeholder="you@business.com"
                  value={step2Email}
                  onChange={(e) => {
                    setStep2Email(e.target.value);
                    setStep2Error(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleStep2SendCode();
                    }
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                На этот адрес будет отправлен код подтверждения.
              </p>
            </div>

            {step2Error && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-800/80 bg-rose-950/80 px-4 py-3 text-xs text-rose-50">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{step2Error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleStep2SendCode}
              disabled={step2IsLoading || !step2Email.trim()}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent-primary,#2563eb)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            >
              {step2IsLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Отправка кода...
                </>
              ) : (
                <>
                  Отправить код
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          // Ввод кода
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-zinc-50">Подтверждение email</h3>
              <p className="text-sm text-zinc-400">
                Мы отправили код подтверждения на <br />
                <span className="font-medium text-zinc-300">{step2Email}</span>
              </p>
            </div>

            <div className="flex justify-center gap-3">
              {step2Code.map((digit, index) => (
                <input
                  key={index}
                  id={`step2-code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleStep2CodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleStep2CodeKeyDown(index, e)}
                  onPaste={index === 0 ? handleStep2CodePaste : undefined}
                  className={`h-16 w-14 rounded-2xl border-2 text-center text-3xl font-bold text-zinc-50 outline-none transition-all duration-200 disabled:opacity-50 ${
                    step2Error
                      ? 'border-rose-500/80 bg-rose-950/40 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
                      : 'border-zinc-700/60 bg-zinc-900/80 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-zinc-600/80 focus:border-[var(--accent-primary,#3b82f6)] focus:bg-zinc-900 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)] focus:ring-0'
                  }`}
                  disabled={step2IsLoading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {step2Error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex items-center gap-3 rounded-xl border-2 border-rose-500/60 bg-gradient-to-r from-rose-950/90 to-rose-900/80 px-4 py-3.5 backdrop-blur-sm shadow-lg"
              >
                <div className="flex-shrink-0 rounded-full bg-rose-500/20 p-1.5">
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                </div>
                <span className="text-sm font-medium text-rose-100">{step2Error}</span>
              </motion.div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleStep2VerifyCode}
                disabled={step2IsLoading || step2Code.join('').length !== 6}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent-primary,#2563eb)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              >
                {step2IsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  <>
                    Подтвердить
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleStep2ResendCode}
                  disabled={step2IsResending}
                  className="text-[var(--accent-primary,#3b82f6)] hover:underline transition-colors disabled:opacity-50"
                >
                  {step2IsResending ? 'Отправка...' : 'Отправить код повторно'}
                </button>
                <button
                  type="button"
                  onClick={handleStep2ChangeEmail}
                  className="text-zinc-400 hover:text-zinc-300 transition-colors"
                >
                  Изменить email
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep3 = () => {
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

    // Показываем поздравительное сообщение после успешной регистрации
    if (registrationCompleted) {
      return (
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-500/30"
          >
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </motion.div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-zinc-50">
              {t<string>("register_success_title")}
            </h3>
            <p className="max-w-md text-sm text-zinc-400 leading-relaxed">
              {t<string>("register_success_message")}
            </p>
          </div>
          <motion.button
            type="button"
            onClick={handleGoToDashboard}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent-primary,#2563eb)] px-8 text-base font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors"
          >
            {t<string>("register_btn_go_to_dashboard")}
            <ArrowRight className="h-5 w-5" />
          </motion.button>
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
            {step === 4 && renderStep4()}
          </CardContent>

          <CardFooter className="relative flex items-center justify-between px-10 pb-6 pt-2 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              {step > 1 && step < 4 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/70 bg-zinc-900/80 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-600/70 transition-all"
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

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

  // Состояния верификации
  // Email верификация через Supabase (не Twilio!)
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "link_sent" | "checking" | "verified" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [confirmedUserId, setConfirmedUserId] = useState<string | undefined>(undefined);
  // Таймер для повторной отправки письма (60 секунд)
  const [resendCooldown, setResendCooldown] = useState(0);
  // Телефон верификация через Twilio SMS
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "verifying" | "verified">("idle");

  const [showPassword, setShowPassword] = useState(false);

  // Состояние для завершения регистрации
  const [finishLoading, setFinishLoading] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  // Supabase клиент (не-null, создается один раз через useState с функцией-инициализатором)
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
    setFormError(null);
    setFormSuccess(null);
    setFinishError(null);
    
    // Выходим из сессии Supabase
    supabase.auth.signOut().catch((err) => {
      console.warn("Error signing out:", err);
    });
  };

  // ========== СОХРАНЕНИЕ СОСТОЯНИЯ В SESSION STORAGE ==========
  // Сохраняем состояние при каждом изменении step, baseData, form
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInitialMount.current) return; // Пропускаем первое сохранение (до восстановления)

    try {
      const stateToSave = {
        step,
        baseData,
        form: {
          email: form.email,
          phone: form.phone,
        },
        emailVerified,
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

    // Проверяем query параметр для начала новой регистрации
    const shouldStartNew = searchParams.get("new") === "true" || searchParams.get("reset") === "true";
    
    if (shouldStartNew) {
      clearRegistrationState();
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      router.replace("/register", { scroll: false });
      isInitialMount.current = false;
      return;
    }

    // Проверяем, есть ли сохранённое состояние в sessionStorage
    const savedStateStr = sessionStorage.getItem(SESSION_STORAGE_KEY);
    
    if (savedStateStr) {
      try {
        const savedState = JSON.parse(savedStateStr);
        const restoredStep = savedState.step || 1;
        
        // Восстанавливаем данные в зависимости от шага
        if (restoredStep === 3) {
          // Шаг 3: Восстанавливаем шаг 1 и 2, но очищаем phone
          if (savedState.baseData) {
            setBaseData(savedState.baseData);
          }
          setForm({
            email: savedState.form?.email || "",
            phone: "", // Очищаем phone
          });
          setStep(3);
          // Восстанавливаем статус email верификации
          // КРИТИЧНО: НЕ устанавливаем verified автоматически - всегда сбрасываем и проверяем через API
          // Polling проверит реальное состояние через /api/auth/check-email-confirmed
          setEmailStatus("link_sent");
          setEmailVerified(false); // Всегда сбрасываем, чтобы polling проверил реальное состояние
        } else if (restoredStep === 2) {
          // Шаг 2: Восстанавливаем шаг 1, но очищаем email
          if (savedState.baseData) {
            setBaseData(savedState.baseData);
          }
          setForm({
            email: "", // Очищаем email
            phone: "",
          });
          setStep(2);
          // Сбрасываем статус email при восстановлении на шаг 2
          setEmailStatus("idle");
          setEmailError(null);
          setEmailVerified(false);
        } else {
          // Шаг 1: Сбрасываем все
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
      // Новая регистрация – чистим хвосты
      localStorage.removeItem("register_email");
      localStorage.removeItem("wellify_email_confirmed");
      localStorage.removeItem("wellify_email_confirmed_for");
    }

    isInitialMount.current = false;
  }, [searchParams, router]);

  // ========== ОЧИСТКА ПРИ УХОДЕ НА ГЛАВНУЮ ==========
  // Отслеживаем изменения pathname и очищаем sessionStorage при уходе со страницы регистрации
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInitialMount.current) return; // Пропускаем первый рендер
    
    // Если мы ушли со страницы регистрации (pathname изменился и не равен /register)
    if (pathname && pathname !== "/register") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [pathname]);

  // Сброс ошибок при смене шага
  useEffect(() => {
    setFormError(null);
    setFormSuccess(null);
    // Сбрасываем верификацию при переходе на другие шаги
    if (step !== 2) {
      setEmailVerified(false);
      setEmailStatus("idle");
      setEmailError(null);
    }
    if (step !== 3) {
      setPhoneVerified(false);
    }
  }, [step]);

  // КРИТИЧНО: Проверка статуса phone_verified при монтировании шага 3
  // Если телефон уже подтверждён в БД, сразу обновляем состояние
  useEffect(() => {
    // Проверяем только на шаге 3, если есть телефон и email, и статус ещё не "verified"
    if (step !== 3 || !form.phone.trim() || !form.email.trim()) {
      return;
    }

    // Если уже подтверждён локально, не проверяем
    if (phoneVerified && phoneStatus === "verified") {
      return;
    }

    // Если статус уже "verifying", polling уже запущен
    if (phoneStatus === "verifying") {
      return;
    }

    // Проверяем статус в БД сразу при монтировании шага 3
    const checkPhoneStatusOnMount = async () => {
      try {
        console.log("[register] 🔍 Checking phone status on step 3 mount", {
          phone: form.phone.trim(),
          email: form.email.trim(),
          phoneStatus,
          phoneVerified,
        });

        const res = await fetch("/api/auth/check-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: form.phone.trim(),
            email: form.email.trim(),
          }),
        });

        if (!res.ok) {
          console.error("[register] check-phone API error on mount:", res.status);
          return;
        }

        const data = await res.json();

        console.log("[register] checkPhoneStatusOnMount response", {
          verified: data.verified,
          fullResponse: data,
        });

        // Если телефон подтверждён в БД, сразу обновляем состояние
        if (data.verified === true) {
          console.log("[register] ✅ Phone already verified in DB! Setting verified state", {
            phone: form.phone.trim(),
          });

          setPhoneStatus("verified");
          setPhoneVerified(true);
          setFormError(null);
        } else {
          // Если не подтверждён, запускаем polling через установку статуса "idle"
          // Polling сам запустится и будет проверять каждую секунду
          if (phoneStatus === "idle") {
            console.log("[register] Phone not verified yet, polling will start automatically");
          }
        }
      } catch (e) {
        console.error("[register] checkPhoneStatusOnMount exception", e);
      }
    };

    // Запускаем проверку с небольшой задержкой, чтобы не конфликтовать с другими эффектами
    const timeoutId = setTimeout(() => {
      checkPhoneStatusOnMount();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [step, form.phone, form.email]); // Запускаем при переходе на шаг 3 или изменении телефона/email

  // НЕ проверяем localStorage автоматически - только через API polling
  // Это гарантирует, что мы проверяем реальное состояние в БД, а не кэш

  // Авто-проверка e-mail через поллинг каждую секунду при статусе link_sent
  // Проверяет profiles.email_verified из базы данных
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
      return; // Если уже подтверждён, не проверяем
    }

    console.log("[register] 🚀 Starting email verification polling", {
      email: form.email.trim(),
      emailStatus,
      emailVerified,
    });

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;
    let hasStartedPolling = false; // Флаг, чтобы не запускать проверку сразу

    const checkEmailConfirmation = async () => {
      try {
        if (cancelled) return;

        // Используем API route, который проверяет profiles.email_verified из базы данных
        // Мониторим изменения в этой ячейке каждую секунду
        // Передаём email в query параметре на случай, если пользователь не залогинен
        const emailParam = encodeURIComponent(form.email.trim());
        const res = await fetch(`/api/auth/check-email-confirmed?email=${emailParam}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          // Если пользователь не залогинен (401), это нормально - продолжаем проверку
          if (res.status === 401) {
            console.log("[register] User not authenticated yet, continuing polling...");
          } else {
            console.error("[register] check-email-confirmed API error:", res.status);
          }
          return; // Продолжаем проверку в фоне
        }

        const data = await res.json();

        // Детальное логирование для отладки
        console.log("[register] checkEmailConfirmation response", {
          success: data.success,
          emailConfirmed: data.emailConfirmed,
          fullResponse: data,
        });

        // КРИТИЧНО: Проверяем ТОЛЬКО data.emailConfirmed из API
        // API проверяет profiles.email_verified, который обновляется в Supabase
        if (data.success === true && data.emailConfirmed === true) {
          // State Machine: Transition WAITING_FOR_VERIFICATION -> VERIFIED
          // Email подтверждён (email_verified = TRUE в profiles)! Переходим в состояние VERIFIED
          if (!cancelled) {
            console.log("[register] ✅ Email verified (email_verified = TRUE)! Transitioning to VERIFIED state", { 
              email: form.email.trim(),
              currentEmailStatus: emailStatus,
              currentEmailVerified: emailVerified,
            });
            
            setEmailStatus("verified");
            setEmailVerified(true);
            setFormSuccess("Отлично! Ваша почта подтверждена, можете переходить к 3 шагу.");
            setEmailError(null);
            
            // Останавливаем интервал
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }

            // Сохраняем в localStorage только после реального подтверждения
            if (typeof window !== "undefined") {
              localStorage.setItem("wellify_email_confirmed", "true");
              localStorage.setItem("wellify_email_confirmed_for", form.email.trim().toLowerCase());
              localStorage.removeItem("register_email");
            }
          }
        } else {
          // State Machine: Остаёмся в WAITING_FOR_VERIFICATION
          // Email ещё не подтверждён - продолжаем polling
          // Логируем каждую проверку для отладки
          console.log("[register] ⏳ Email not confirmed yet, continuing polling...", { 
            email: form.email.trim(),
            success: data.success,
            emailConfirmed: data.emailConfirmed,
            reason: data.reason,
          });
        }
      } catch (e) {
        console.error("[register] checkEmailConfirmation exception", e);
        // Продолжаем проверку в фоне даже при ошибке
      }
    };

    // НЕ запускаем проверку сразу - даём время письму отправиться
    // Запускаем первую проверку через 3 секунды после отправки письма
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
    }, 3000); // 3 секунды задержка перед первой проверкой

    // Устанавливаем интервал для периодической проверки (каждую секунду)
    // Мониторим изменения в profiles.email_verified каждую секунду
    intervalId = setInterval(() => {
      if (!cancelled && !emailVerified && emailStatus === "link_sent" && hasStartedPolling) {
        checkEmailConfirmation();
      } else if (emailVerified && intervalId) {
        clearInterval(intervalId);
      }
    }, 1000); // Проверяем каждую секунду

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

  // Таймер для кнопки "Отправить письмо ещё раз" (60 секунд)
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

  // Авто-проверка телефона через поллинг каждую секунду при статусе verifying
  // Проверяет profiles.phone_verified из базы данных
  // Также проверяет статус при монтировании шага 3, если телефон уже подтверждён в БД
  useEffect(() => {
    // Если уже подтверждён локально, не проверяем
    if (phoneVerified && phoneStatus === "verified") {
      console.log("[register] Phone already verified locally, skipping polling");
      return;
    }

    // КРИТИЧНО: На шаге 3 всегда проверяем статус в БД, независимо от phoneStatus
    // Это нужно, чтобы обнаружить, если телефон уже подтверждён в БД
    if (step !== 3) {
      // На других шагах проверяем только если статус "verifying"
      if (phoneStatus !== "verifying") {
        console.log("[register] Phone polling not started: not on step 3 and phoneStatus is not 'verifying'", { phoneStatus, step });
        return;
      }
    } else {
      // На шаге 3 проверяем для статусов "verifying" и "idle"
      if (phoneStatus !== "verifying" && phoneStatus !== "idle") {
        console.log("[register] Phone polling not started: step 3 but phoneStatus is not 'verifying' or 'idle'", { phoneStatus });
        return;
      }
    }

    if (!form.phone.trim()) {
      console.log("[register] Phone polling not started: phone is empty");
      return;
    }

    // Если на шаге 3 и статус "idle" - проверяем сразу, возможно телефон уже подтверждён в БД
    const shouldCheckImmediately = step === 3 && phoneStatus === "idle" && !phoneVerified;

    console.log("[register] 🚀 Starting phone verification polling", {
      phone: form.phone.trim(),
      phoneStatus,
      phoneVerified,
      step,
      shouldCheckImmediately,
    });

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;
    let hasStartedPolling = false; // Флаг, чтобы не запускать проверку сразу

    const checkPhoneConfirmation = async () => {
      try {
        if (cancelled) return;

        // Используем API route, который проверяет profiles.phone_verified из базы данных
        // Мониторим изменения в этой ячейке каждую секунду
        // Передаём phone и email в body для поиска пользователя
        const res = await fetch("/api/auth/check-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            phone: form.phone.trim(),
            email: form.email.trim(), // Передаём email для поиска пользователя, если не залогинен
          }),
        });

        if (!res.ok) {
          console.error("[register] check-phone API error:", res.status);
          return; // Продолжаем проверку в фоне
        }

        const data = await res.json();

        // Детальное логирование для отладки
        console.log("[register] checkPhoneConfirmation response", {
          verified: data.verified,
          fullResponse: data,
        });

        // КРИТИЧНО: Проверяем ТОЛЬКО data.verified из API
        // API проверяет profiles.phone_verified, который обновляется в Supabase
        if (data.verified === true) {
          // State Machine: Transition VERIFYING -> VERIFIED
          // Телефон подтверждён (phone_verified = TRUE в profiles)! Переходим в состояние VERIFIED
          if (!cancelled) {
            console.log("[register] ✅ Phone verified (phone_verified = TRUE)! Transitioning to VERIFIED state", { 
              phone: form.phone.trim(),
              currentPhoneStatus: phoneStatus,
              currentPhoneVerified: phoneVerified,
            });
            
            setPhoneStatus("verified");
            setPhoneVerified(true);
            setFormError(null);
            
            // Останавливаем интервал
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
          }
        } else {
          // State Machine: Остаёмся в VERIFYING
          // Телефон ещё не подтверждён - продолжаем polling
          // Логируем каждую проверку для отладки
          console.log("[register] ⏳ Phone not verified yet, continuing polling...", { 
            phone: form.phone.trim(),
            verified: data.verified,
          });
        }
      } catch (e) {
        console.error("[register] checkPhoneConfirmation exception", e);
        // Продолжаем проверку в фоне даже при ошибке
      }
    };

    // Если на шаге 3 и статус "idle" - проверяем сразу (возможно телефон уже подтверждён в БД)
    if (shouldCheckImmediately) {
      console.log("[register] 🔍 Checking phone status immediately (step 3, idle status)");
      hasStartedPolling = true;
      checkPhoneConfirmation();
    }

    // НЕ запускаем проверку сразу для статуса "verifying" - даём время обновлению в БД
    // Запускаем первую проверку через 2 секунды после установки статуса verifying
    const initialDelay = setTimeout(() => {
      if (!cancelled && !phoneVerified && phoneStatus === "verifying" && !hasStartedPolling) {
        hasStartedPolling = true;
        console.log("[register] 🔍 Starting first phone check after delay");
        checkPhoneConfirmation();
      } else if (!shouldCheckImmediately) {
        console.log("[register] ⚠️ First phone check skipped", {
          cancelled,
          phoneVerified,
          phoneStatus,
          shouldCheckImmediately,
        });
      }
    }, shouldCheckImmediately ? 0 : 2000); // Если проверяем сразу, задержка 0, иначе 2 секунды

    // Устанавливаем интервал для периодической проверки (каждую секунду)
    // Мониторим изменения в profiles.phone_verified каждую секунду
    // Работает для статусов "verifying" и "idle" на шаге 3
    intervalId = setInterval(() => {
      if (!cancelled && !phoneVerified && (phoneStatus === "verifying" || (phoneStatus === "idle" && step === 3)) && hasStartedPolling) {
        checkPhoneConfirmation();
      } else if (phoneVerified && intervalId) {
        clearInterval(intervalId);
      }
    }, 1000); // Проверяем каждую секунду

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (initialDelay) {
        clearTimeout(initialDelay);
      }
    };
  }, [phoneStatus, form.phone, form.email, phoneVerified, step]); // Добавляем form.email для поиска пользователя

  // Сохранение состояния регистрации в localStorage
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

  // Функции для Supabase email verification (НЕ Twilio!)
  const handleSendEmailLink = async () => {
    // Защита от повторных вызовов
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

      // Таймаут для защиты от зависания статуса "sending"
      timeoutId = setTimeout(() => {
        console.error("[register] handleSendEmailLink timeout - resetting status");
        setEmailStatus("error");
        setEmailError("Превышено время ожидания. Попробуйте ещё раз.");
      }, 30000); // 30 секунд

      // Валидация email перед отправкой
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
        setEmailStatus("error");
        setEmailError("Пожалуйста, введите корректный e-mail адрес.");
        return;
      }

      // Валидация обязательных полей из шага 1
      if (!baseData.firstName.trim() || !baseData.lastName.trim() || !baseData.password) {
        setEmailStatus("error");
        setEmailError("Пожалуйста, заполните все обязательные поля на шаге 1.");
        return;
      }

      // Используем текущий origin для redirect после подтверждения email
      const redirectTo = typeof window !== "undefined" 
        ? `${window.location.origin}/email-confirmed`
        : `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://dev.wellifyglobal.com"}/email-confirmed`;

      // Формируем полное имя из компонентов (Фамилия Имя Отчество)
      const fullName = [
        baseData.lastName.trim(),
        baseData.firstName.trim(),
        baseData.middleName.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      // Убеждаемся, что birth_date в формате YYYY-MM-DD
      const birthDateFormatted = baseData.birthDate; // input type="date" уже возвращает YYYY-MM-DD

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
            birth_date: birthDateFormatted, // Формат YYYY-MM-DD
            locale: localeForAPI, // Сохраняем язык интерфейса: 'ru' | 'uk' | 'en'
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
        
        // Если пользователь уже существует, показываем красное уведомление
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
          setEmailError("Этот e-mail уже зарегистрирован. Пожалуйста, войдите в систему.");
          return;
        } else {
          setEmailStatus("error");
          setEmailError(error.message || "Не удалось отправить письмо. Попробуйте ещё раз.");
          return;
        }
      }

      // Проверяем, что пользователь действительно создан
      if (!data || !data.user) {
        console.error("[register] signUp returned no user", { data });
        if (timeoutId) clearTimeout(timeoutId);
        setEmailStatus("error");
        setEmailError("Не удалось создать пользователя. Пожалуйста, попробуйте ещё раз.");
        return;
      }

      // Успешная отправка - пользователь создан
      const normalizedEmail = form.email.trim().toLowerCase();
      if (typeof window !== "undefined") {
        localStorage.setItem("register_email", normalizedEmail);
        // Очищаем старые флаги подтверждения, чтобы не показывать "подтверждено" сразу
        localStorage.removeItem("wellify_email_confirmed");
        localStorage.removeItem("wellify_email_confirmed_for");
      }
      if (timeoutId) clearTimeout(timeoutId);
      setEmailStatus("link_sent");
      setEmailVerified(false); // Убеждаемся, что verified = false после отправки
      setFormSuccess(null); // Очищаем сообщение об успехе
      // Запускаем таймер для повторной отправки (60 секунд)
      setResendCooldown(60);
      
      // ВАЖНО: Проверяем, создалась ли сессия после signUp
      // Если нет, пытаемся получить сессию
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("[register] ⚠️ No session after signUp, email will be checked via email parameter");
      } else {
        console.log("[register] ✅ Session created after signUp", { userId: session.user.id });
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
      setEmailError(e?.message ?? "Не удалось отправить письмо. Попробуйте ещё раз.");
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return; // Защита от повторных вызовов во время таймера
    await handleSendEmailLink();
    // Таймер запустится автоматически после успешной отправки в handleSendEmailLink
  };

  const handleChangeEmail = async () => {
    // Очищаем состояние
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
      
      // очистить сохранённую регистрацию, если email меняется
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
    
    // Выходим из сессии
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Error signing out:", err);
    }
    
    // Обнуляем email и статусы
    setForm((prev) => ({ ...prev, email: "" }));
    setEmailStatus("idle");
    setFormError(null);
    setFormSuccess(null);
  };


  const finishRegistration = async () => {
    try {
      setFinishLoading(true);
      setFinishError(null);

      // КРИТИЧНО: Проверяем статусы из БД (аналогично шагу 2)
      // Email должен быть подтверждён (email_verified = TRUE в profiles)
      if (emailStatus !== "verified" || !emailVerified) {
        setFinishError("E-mail должен быть подтверждён. Вернитесь на предыдущий шаг.");
        setFinishLoading(false);
        return;
      }

      // Телефон должен быть подтверждён (phone_verified = TRUE в profiles)
      // Проверяем через polling, который отслеживает profiles.phone_verified из БД
      if (phoneStatus !== "verified" || !phoneVerified) {
        setFinishError("Телефон ещё не подтверждён. Пожалуйста, подождите подтверждения.");
        setFinishLoading(false);
        return;
      }

      // Собираем данные для регистрации
      const registrationData = {
        email: form.email.trim(),
        password: baseData.password,
        phone: form.phone.trim(),
        firstName: baseData.firstName.trim(),
        lastName: baseData.lastName.trim(),
        middleName: baseData.middleName.trim(),
      };

      // Вызываем API для создания/обновления пользователя и профиля
      const res = await fetch("/api/auth/register-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data.success) {
        const errorMessage =
          data?.message ||
          "Не удалось завершить регистрацию. Попробуйте ещё раз.";
        setFinishError(errorMessage);
        return;
      }

      // После успешного создания пользователя - авторизуем его на этом устройстве
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: baseData.password,
      });

      if (signInError) {
        // Аккаунт создан, но не удалось войти
        setFinishError(
          "Аккаунт создан, но не удалось выполнить вход. Попробуйте войти вручную на странице входа."
        );
        return;
      }

      // Очищаем сохранённое состояние регистрации
      if (typeof window !== "undefined") {
        localStorage.removeItem("register_in_progress");
        localStorage.removeItem("wellify_email_confirmed");
        localStorage.removeItem("wellify_email_confirmed_for");
        localStorage.removeItem("register_email");
      }

      // Редирект на дашборд директора
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

  // Оставляем старые функции для обратной совместимости
  const handleCompleteRegistration = finishRegistration;

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

    // Поле ввода e-mail активно только если idle или error
    const isEmailInputDisabled = emailStatus === "sending" || emailStatus === "link_sent" || emailStatus === "verified";

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

        {/* БАННЕРЫ - Компактный контейнер */}
        <div className="mt-3">
          {emailStatus === "sending" && (
            <div className="w-full rounded-lg border border-blue-500/40 bg-blue-500/10 p-4 text-sm text-blue-300">
              Отправляем письмо...
            </div>
          )}
          {emailStatus === "link_sent" && (
            <div className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              Мы отправили письмо на <strong>{form.email.trim()}</strong>. Пожалуйста, подтвердите e-mail, чтобы продолжить.
            </div>
          )}
        </div>

        {/* Красное уведомление об ошибке */}
        {emailError && (
          <div className="mt-3 w-full rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
            {emailError}
          </div>
        )}

        {/* Дополнительные действия, когда письмо уже отправлено, но ещё не подтверждено */}
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

        {/* Уведомления на шаге 2 - успех и ошибки */}
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

          {/* Кнопка "Отправить письмо" показывается когда idle, error или sending (с индикатором) */}
          {(emailStatus === "idle" || emailStatus === "error" || emailStatus === "sending") && (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={!isEmailValid || emailStatus === "sending"}
              onClick={handleSendEmailLink}
            >
              {emailStatus === "sending" ? "Отправка..." : "Отправить письмо"}
            </Button>
          )}

          {/* State Machine: VERIFIED State - Кнопка "Далее" показывается ТОЛЬКО когда emailVerified === true из БД */}
          {emailStatus === "verified" && emailVerified === true && (
            <Button
              type="button"
              className="w-full md:w-auto"
              onClick={() => setStep(3)}
            >
              Далее
            </Button>
          )}
          
          {/* State Machine: IDLE/WAITING_FOR_VERIFICATION - Кнопка "Далее" СКРЫТА (не рендерим ничего) */}
        </div>
      </div>
    );
  };

  const renderStep3 = () => {

    return (
      <div className="space-y-4">
        {!phoneVerified ? (
          <PhoneStep
            initialPhone={form.phone}
            locale={localeForAPI}
            email={form.email} // Передаём email для поиска пользователя в БД
            onPhoneVerified={(verifiedPhone) => {
              // Когда Twilio подтвердил код, обновляем телефон и запускаем polling
              setForm((prev) => ({ ...prev, phone: verifiedPhone }));
              setPhoneStatus("verifying"); // Запускаем polling для проверки phone_verified в БД
              // НЕ устанавливаем phoneVerified сразу - ждём подтверждения из БД через polling
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

        {/* State Machine: VERIFIED - телефон подтверждён в БД */}
        {/* Показываем ТОЛЬКО когда phoneStatus === "verified" и phoneVerified === true */}
        {phoneStatus === "verified" && phoneVerified && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Телефон успешно подтверждён.</span>
          </div>
        )}

        {finishError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{finishError}</span>
          </div>
        )}

        {/* Уведомления на шаге 3 - только ошибки, без formSuccess */}
        {formError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

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
          {/* State Machine: VERIFIED - кнопка активна только когда phoneVerified === true из БД */}
          <Button
            type="button"
            className="w-full md:w-auto"
            disabled={finishLoading || !phoneVerified || !emailVerified || phoneStatus !== "verified"}
            onClick={finishRegistration}
          >
            {finishLoading ? "Завершаем..." : "Завершить регистрацию"}
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

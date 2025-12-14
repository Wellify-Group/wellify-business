// app/register/RegisterDirectorClient.tsx (ФИНАЛЬНЫЙ КОД - ИСПРАВЛЕНИЕ 400 Bad Request и UI)

"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { TelegramVerificationStep } from "./TelegramVerificationStep";
import { cn } from "@/lib/utils";

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
  const { language, t } = useLanguage();

  // Состояние шагов регистрации
  const [step, setStep] = useState<Step>(1); // Текущий активный шаг
  const [maxStepReached, setMaxStepReached] = useState<Step>(1); // Максимальный достигнутый шаг (для блокировки недоступных шагов)

  // Данные формы шага 1: личные данные директора
  const [personal, setPersonal] = useState<PersonalForm>({
    firstName: "",
    middleName: "",
    lastName: "",
    birthDate: "",
    password: "",
    passwordConfirm: "",
  });

  // Локальное состояние для отображаемого значения даты рождения (ДД.ММ.ГГГГ)
  const [displayDate, setDisplayDate] = useState<string>("");

  // Данные шага 2: рабочий e-mail
  const [email, setEmail] = useState("");

  // Состояние ошибок регистрации
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Данные зарегистрированного пользователя (сохраняются после signUp)
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [registeredUserEmail, setRegisteredUserEmail] = useState<string | null>(
    null
  );
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  // Флаг процесса отправки формы
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Состояние верификации e-mail
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "link_sent" | "verified" | "error"
  >("idle");
  const [emailVerified, setEmailVerified] = useState(false);

  const [supabase] = useState(() => createBrowserSupabaseClient());

  const localeForAPI =
    language === "ua" ? "uk" : (language as "ru" | "uk" | "en" | string);

  // ---------- Обработчики событий ----------

  // Обработчик изменения полей формы личных данных
  const handlePersonalChange =
    (field: keyof PersonalForm) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Просто обновляем значение без валидации - валидация будет при отправке
      setPersonal((prev) => ({ ...prev, [field]: value }));
    };

  // Валидация и переход со шага 1 (личные данные) на шаг 2 (e-mail)
  const handleNextFromStep1 = () => {
    setRegisterError(null);

    if (!personal.firstName.trim() || !personal.lastName.trim()) {
      setRegisterError(t<string>("register_error_name_required"));
      return;
    }

    if (!personal.birthDate || !personal.birthDate.trim()) {
      setRegisterError(t<string>("register_error_birth_date_required"));
      return;
    }

    // Валидация даты рождения: проверка формата и года (от 1920 до текущего года)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(personal.birthDate)) {
      setRegisterError(t<string>("register_error_birth_date_invalid_format"));
      return;
    }

    const birthDateObj = new Date(personal.birthDate);
    if (isNaN(birthDateObj.getTime())) {
      setRegisterError(t<string>("register_error_birth_date_invalid"));
      return;
    }

    const currentYear = new Date().getFullYear();
    const minYear = 1920;
    const birthYear = birthDateObj.getFullYear();
    
    if (birthYear < minYear || birthYear > currentYear) {
      setRegisterError(t<string>("register_error_birth_date_year_range").replace("{minYear}", String(minYear)).replace("{currentYear}", String(currentYear)));
      return;
    }

    // Проверка, что дата не в будущем
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (birthDateObj > today) {
      setRegisterError(t<string>("register_error_birth_date_future"));
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
    setStep(2);
    setMaxStepReached((prev) => (prev < 2 ? 2 : prev));
  };

  // Обработчик отправки формы шага 2 (e-mail)
  const handleSubmitStep2 = async (e: FormEvent) => {
    e.preventDefault();
    await handleSendEmailLink();
  };

  // Отправка письма для подтверждения e-mail через Supabase Auth
  const handleSendEmailLink = async () => {
    if (emailStatus === "sending" || emailStatus === "link_sent") return;

    setRegisterError(null);

    if (!email.trim()) {
      setRegisterError(t<string>("register_error_email_required"));
      setEmailStatus("error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setRegisterError(t<string>("register_error_email_invalid"));
      setEmailStatus("error");
      return;
    }

    if (
      !personal.firstName.trim() ||
      !personal.lastName.trim() ||
      !personal.password
    ) {
      setRegisterError(
        t<string>("register_error_personal_data_required")
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

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/email-confirmed`
          : `${
              process.env.NEXT_PUBLIC_SITE_URL ?? "https://dev.wellifyglobal.com"
            }/email-confirmed`;

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
          msg.includes("registered")
        ) {
          setRegisterError(
            t<string>("register_error_email_exists")
          );
        } else {
          setRegisterError(
            error.message ||
              t<string>("register_error_email_send_failed")
          );
        }
        return;
      }

      if (!data?.user) {
        console.error("[register] signUp returned no user", { data });
        setEmailStatus("error");
        setRegisterError(
          t<string>("register_error_account_creation_failed")
        );
        return;
      }

      setRegisteredUserId(data.user.id);
      setRegisteredUserEmail(data.user.email ?? email.trim());

      setEmailStatus("link_sent");
    } catch (err) {
      console.error("[register] handleSendEmailLink error", err);
      setEmailStatus("error");
      setRegisterError(t<string>("register_error_internal"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Возврат на предыдущий шаг
  const handleBack = () => {
    setRegisterError(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  // Проверка доступности перехода на указанный шаг
  const canGoToStep = (target: Step) => {
    if (target === 1) return true;
    if (target === 2) return maxStepReached >= 2;
    if (target === 3) return emailVerified && maxStepReached >= 3;
    return false;
  };

  /**
   * Завершение регистрации и переход в дашборд
   * Проверяет два условия:
   * 1. phone должен быть заполнен в профиле
   * 2. telegram_verified должен быть true
   * Если оба условия выполнены - сразу редирект в дашборд
   */
  const finishRegistration = async () => {
    try {
      setIsSubmitting(true);
      setRegisterError(null);

      // Проверяем наличие необходимых данных
      if (!registeredUserEmail || !personal.password) {
        setRegisterError(t<string>("register_error_finish_data_missing"));
        return;
      }

      // Проверяем или восстанавливаем сессию пользователя
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Если сессии нет, пытаемся восстановить её через signIn
      if (!session?.user) {
        console.log("[register] Session not found, attempting to restore...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: registeredUserEmail,
          password: personal.password,
        });

        if (signInError || !signInData?.user) {
          console.error("[register] Failed to restore session", signInError);
          setRegisterError(t<string>("register_error_session_restore_failed"));
          return;
        }

        session = signInData.session;
      }

      if (!session?.user) {
        setRegisterError(t<string>("register_error_session_not_found"));
        return;
      }

      // Загружаем профиль через API endpoint (обходит RLS через admin клиент)
      let profileResponse = await fetch('/api/auth/load-profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Если получили 401, пытаемся восстановить сессию и повторить запрос
      if (profileResponse.status === 401) {
        console.log("[register] Got 401, attempting to restore session and retry...");
        
        // Пытаемся восстановить сессию через signIn
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: registeredUserEmail,
          password: personal.password,
        });

        if (signInError || !signInData?.user) {
          console.error("[register] Failed to restore session in finishRegistration", signInError);
          setRegisterError(t<string>("register_error_session_expired"));
          return;
        }

        // Повторяем запрос профиля после восстановления сессии
        profileResponse = await fetch('/api/auth/load-profile', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (profileResponse.status === 401) {
          console.error("[register] Still not authenticated after restore");
          setRegisterError(t<string>("register_error_session_expired"));
          return;
        }
      }
      
      if (!profileResponse.ok) {
        console.error("[register] Failed to load profile via API in finishRegistration", profileResponse.status);
        setRegisterError(t<string>("register_error_profile_check_failed"));
        return;
      }

      const profileData = await profileResponse.json();
      if (!profileData.success || !profileData.user) {
        console.error("[register] Profile not loaded via API in finishRegistration");
        setRegisterError(t<string>("register_error_profile_load_failed"));
        return;
      }

      const profile = profileData.user;

      // Проверка условия 1: phone должен быть заполнен
      if (!profile?.phone || profile.phone.trim() === "") {
        setRegisterError(t<string>("register_error_phone_not_verified"));
        return;
      }

      // Проверка условия 2: telegram_verified должен быть true (строгая проверка)
      // Проверяем telegram_verified - может быть булево true или строка "true"
      const isTelegramVerified = profile?.telegram_verified === true || 
                                 profile?.telegram_verified === "true" ||
                                 profile?.telegram_verified === 1;

      if (!isTelegramVerified) {
        setRegisterError(t<string>("register_error_telegram_not_verified"));
        return;
      }

      // Оба условия выполнены - сразу редирект в дашборд директора
      router.push("/dashboard/director");
    } catch (e) {
      console.error("finishRegistration error", e);
      setRegisterError(
        t<string>("register_error_unknown")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчик успешной верификации Telegram
  const handleTelegramVerified = async (phone?: string) => {
    // Сохраняем подтвержденный телефон
    if (phone) {
      setVerifiedPhone(phone);
    }
    // Переходим на шаг 4 - успешное завершение регистрации
    // Проверка данных будет выполнена автоматически через useEffect на шаге 4
    setStep(4);
    setMaxStepReached(4);
    setRegisterError(null);
  };

  // ---------- Polling подтверждения e-mail ----------

  /**
   * Polling для проверки подтверждения e-mail
   * После отправки письма проверяет статус подтверждения каждые 1.5 секунды
   * При подтверждении автоматически переходит на шаг 3 (Telegram)
   */
  useEffect(() => {
    if (emailStatus !== "link_sent") return;
    if (!email.trim()) return;

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    const check = async () => {
      if (cancelled) return;

      try {
        const res = await fetch(
          `/api/auth/check-email-confirmed?email=${encodeURIComponent(
            email.trim()
          )}`
        );

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        console.log("[register] check-email-confirmed response", data);

        if (data.success && data.emailConfirmed) {
          console.log("[register] Email confirmed, moving to step 3");
          setEmailStatus("verified");
          setEmailVerified(true);
          setRegisterError(null);

          // Переход на шаг 3 (Telegram верификация)
          setStep(3);
          setMaxStepReached((prev) => (prev < 3 ? 3 : prev));

          // Останавливаем polling после подтверждения
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (e) {
        console.error("[register] check-email-confirmed error", e);
      }
    };

    console.log("[register] Starting email confirmation polling");
    // Первая проверка через 3 секунды, затем каждые 1.5 секунды
    const initial = setTimeout(check, 3000);
    intervalId = setInterval(check, 1500);

    return () => {
      cancelled = true;
      clearTimeout(initial);
      if (intervalId) clearInterval(intervalId);
    };
  }, [emailStatus, email]);

  // ---------- Автоматическая проверка готовности данных на шаге 4 ----------
  
  /**
   * Проверяет готовность данных профиля (phone и telegram_verified) когда пользователь на шаге 4
   * Если данные не готовы, показывает сообщение и повторяет проверку каждые 2 секунды
   */
  useEffect(() => {
    if (step !== 4) return;
    
    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;
    
    const checkProfileReady = async () => {
      if (cancelled) return;
      
      try {
        // Проверяем сессию
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          // Если нет сессии, не показываем ошибку - просто ждем
          console.log("[register] No session yet on step 4, waiting...");
          return;
        }
        
        // Используем API endpoint для загрузки профиля (обходит RLS)
        const profileResponse = await fetch('/api/auth/load-profile', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        // Если 401 - сессия еще не готова, просто ждем без ошибки
        if (profileResponse.status === 401) {
          console.log("[register] Not authenticated yet, waiting...");
          return;
        }
        
        if (!profileResponse.ok) {
          console.error("[register] Failed to load profile via API", profileResponse.status);
          // Не показываем ошибку при временных проблемах
          return;
        }
        
        const profileData = await profileResponse.json();
        if (!profileData.success || !profileData.user) {
          console.log("[register] Profile not loaded via API");
          return;
        }
        
        const profile = profileData.user;
        
        console.log("[register] Profile check on step 4:", {
          hasPhone: !!profile?.phone,
          phone: profile?.phone,
          telegramVerified: profile?.telegram_verified,
        });
        
        // Если данные готовы - убираем ошибку и останавливаем проверку
        const hasPhone = profile?.phone && profile.phone.trim() !== "";
        const isTelegramVerified = profile?.telegram_verified === true || 
                                   profile?.telegram_verified === "true" ||
                                   profile?.telegram_verified === 1;
        
        if (hasPhone && isTelegramVerified) {
          console.log("[register] Profile ready, clearing error");
          setRegisterError(null);
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          return;
        }
        
        // Если данные еще не готовы, показываем сообщение только если его еще нет
        const waitingText = t<string>("register_waiting_telegram");
        if (!registerError || registerError !== waitingText) {
          setRegisterError(waitingText);
        }
      } catch (error) {
        console.error("[register] Error checking profile on step 4", error);
        // Не показываем ошибку пользователю при временных проблемах сети
      }
    };
    
    // При переходе на шаг 4 сначала очищаем ошибки
    setRegisterError(null);
    
    // Первая проверка через небольшую задержку (чтобы дать время БД обновиться)
    const initialTimeout = setTimeout(() => {
      checkProfileReady();
      // Затем проверяем каждые 2 секунды
      intervalId = setInterval(checkProfileReady, 2000);
    }, 1500);
    
    return () => {
      cancelled = true;
      clearTimeout(initialTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, supabase]);

  // ---------- Функции рендеринга UI ----------

  /**
   * Рендер вкладок шагов регистрации
   * Показывает три шага: Основные данные, E-mail, Telegram
   * Активный шаг подсвечивается, недоступные шаги блокируются
   */
  const renderTabs = () => {
    const tabs: { id: Step; label: string }[] = [
      { id: 1, label: t<string>("register_tab_basic_data") },
      { id: 2, label: t<string>("register_tab_email") },
      { id: 3, label: t<string>("register_tab_telegram") },
    ];

    return (
      <div className="mb-6 flex items-center justify-between rounded-full border border-border/50 bg-muted/30 backdrop-blur-sm px-1 py-1 text-[13px]">
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
                "flex-1 rounded-full px-3 py-1.5 text-center transition-all duration-250 ease-out",
                active
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-primary-foreground shadow-[0_0_24px_rgba(88,130,255,0.45)] translate-y-[-1px] font-medium"
                  : reachable
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  : "text-muted-foreground/60 cursor-default",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  };

  /**
   * Рендер заголовка и описания текущего шага
   */
  const renderStepTitle = () => {
    let descriptionText: string | null = null;

    if (step === 1) {
      descriptionText = t<string>("register_step1_description");
    } else if (step === 2) {
      descriptionText = t<string>("register_step2_description");
    } else {
      // Для шага 3 описание убираем, чтобы не дублировать текст про подтверждение телефона
      descriptionText = null;
    }

    return (
      <>
        {step === 1 && (
          <CardTitle className="text-center text-[22px] font-semibold tracking-tight text-foreground">
            {t<string>("register_title")}
          </CardTitle>
        )}
        {descriptionText && (
          <CardDescription className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
            {descriptionText}
          </CardDescription>
        )}
      </>
    );
  };

  /**
   * Рендер шага 1: Личные данные директора
   * Поля: Имя, Отчество, Фамилия, Дата рождения, Пароль, Подтверждение пароля
   */
  // Синхронизация displayDate с personal.birthDate при изменении извне (только если displayDate пустой)
  useEffect(() => {
    if (personal.birthDate && !displayDate) {
      try {
        const date = new Date(personal.birthDate);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          const formatted = `${day}.${month}.${year}`;
          setDisplayDate(formatted);
        }
      } catch {
        // Игнорируем ошибки парсинга
      }
    } else if (!personal.birthDate && displayDate && displayDate.length === 10) {
      // Если birthDate очищен программно (не пользователем), очищаем displayDate
      // Но только если это не редактирование пользователем
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal.birthDate]);

  const renderStep1 = () => {
    // Функция для парсинга ДД.ММ.ГГГГ в YYYY-MM-DD (принимает числа без ведущих нулей)
    const parseDateFromDisplay = (displayStr: string): string | null => {
      if (!displayStr || displayStr.trim() === "") return null;
      const parts = displayStr.split(".");
      if (parts.length !== 3) return null;
      
      // Нормализуем: добавляем ведущие нули для дня и месяца
      const day = parts[0].trim().padStart(2, "0");
      const month = parts[1].trim().padStart(2, "0");
      const year = parts[2].trim();
      
      // Проверяем, что год состоит из 4 цифр
      if (year.length !== 4) {
        return null;
      }
      
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
        return null;
      }
      
      // Проверка валидности даты
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
        return null;
      }
      
      const date = new Date(yearNum, monthNum - 1, dayNum);
      if (
        date.getDate() !== dayNum ||
        date.getMonth() !== monthNum - 1 ||
        date.getFullYear() !== yearNum
      ) {
        return null; // Невалидная дата (например, 31.02.2024)
      }
      
      return `${year}-${month}-${day}`;
    };

    // Обработчик для поля даты рождения
    const handleBirthDateChange = (e: ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      
      // Удаляем все кроме цифр и точек
      value = value.replace(/[^\d.]/g, "");
      
      // Ограничиваем общую длину
      if (value.length > 10) {
        value = value.slice(0, 10);
      }
      
      // Разбиваем на части
      const parts = value.split(".");
      let day = parts[0] || "";
      let month = parts[1] || "";
      let year = parts[2] || "";
      
      // Ограничиваем длину каждой части
      day = day.slice(0, 2);
      month = month.slice(0, 2);
      year = year.slice(0, 4);
      
      // Автоматически добавляем точку после дня, если введено 2+ цифры подряд
      if (day.length >= 2 && !value.includes(".") && value.length > 2) {
        const remaining = value.slice(2);
        if (remaining) {
          month = remaining.slice(0, 2);
        }
      }
      
      // Автоматически добавляем точку после месяца, если введено 2+ цифры
      if (month.length >= 2 && parts.length === 2) {
        const monthPart = value.split(".")[1];
        if (monthPart && monthPart.length > 2) {
          year = monthPart.slice(2, 6);
        }
      }
      
      // Собираем значение
      let formattedValue = day;
      if (month || (day.length >= 2 && value.includes("."))) {
        formattedValue += "." + month;
      }
      if (year || (month.length >= 2 && parts.length >= 2)) {
        formattedValue += "." + year;
      }
      
      // Автоматически добавляем ведущие нули для дня, когда пользователь начинает вводить месяц
      const finalParts = formattedValue.split(".");
      if (finalParts.length >= 2 && finalParts[0].length === 1) {
        // Если день состоит из одной цифры и пользователь начал вводить месяц, добавляем ведущий ноль
        finalParts[0] = finalParts[0].padStart(2, "0");
      }
      if (finalParts.length >= 3 && finalParts[1].length === 1) {
        // Если месяц состоит из одной цифры и пользователь начал вводить год, добавляем ведущий ноль
        finalParts[1] = finalParts[1].padStart(2, "0");
      }
      
      formattedValue = finalParts.join(".");
      
      // Обновляем отображаемое значение
      setDisplayDate(formattedValue);
      
      // Парсим в YYYY-MM-DD только если дата полностью введена
      const checkParts = formattedValue.split(".");
      const hasDay = checkParts[0] && checkParts[0].length > 0;
      const hasMonth = checkParts[1] && checkParts[1].length > 0;
      const hasYear = checkParts[2] && checkParts[2].length === 4;
      
      if (hasDay && hasMonth && hasYear) {
        // Нормализуем: добавляем ведущие нули для дня и месяца (на случай если они ещё не добавлены)
        const normalizedDay = checkParts[0].padStart(2, "0");
        const normalizedMonth = checkParts[1].padStart(2, "0");
        const normalizedYear = checkParts[2];
        const normalizedValue = `${normalizedDay}.${normalizedMonth}.${normalizedYear}`;
        
        // Обновляем отображаемое значение с нормализованными значениями
        if (normalizedValue !== formattedValue) {
          setDisplayDate(normalizedValue);
        }
        
        const parsedDate = parseDateFromDisplay(normalizedValue);
        if (parsedDate) {
          // Проверяем валидность года (1920 - текущий год)
          const yearNum = parseInt(normalizedYear, 10);
          const currentYear = new Date().getFullYear();
          const minYear = 1920;
          
          if (yearNum >= minYear && yearNum <= currentYear) {
            setPersonal((prev) => ({ ...prev, birthDate: parsedDate }));
          } else {
            // Год вне диапазона - очищаем birthDate
            setPersonal((prev) => ({ ...prev, birthDate: "" }));
          }
        } else {
          // Если дата невалидна, очищаем birthDate
          setPersonal((prev) => ({ ...prev, birthDate: "" }));
        }
      } else {
        // Если дата неполная или поле очищено, очищаем birthDate
        setPersonal((prev) => ({ ...prev, birthDate: "" }));
      }
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2.5 md:gap-3 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t<string>("register_field_first_name")}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <User className="h-3.5 w-3.5 text-[color:var(--color-success)] opacity-70" />
              </div>
              <input
                type="text"
                className="h-11 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]"
                value={personal.firstName}
                onChange={handlePersonalChange("firstName")}
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t<string>("register_field_middle_name")}
            </label>
            <div className="relative">
              <input
                type="text"
                className="h-11 w-full rounded-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]"
                value={personal.middleName}
                onChange={handlePersonalChange("middleName")}
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t<string>("register_field_last_name")}
            </label>
            <div className="relative">
              <input
                type="text"
                className="h-11 w-full rounded-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]"
                value={personal.lastName}
                onChange={handlePersonalChange("lastName")}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t<string>("register_field_birth_date")}
            </label>
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center z-10">
                <Calendar className="h-4 w-4 text-[color:var(--color-success)] opacity-70" />
              </div>
              <input
                type="text"
                inputMode="numeric"
                className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)] hover:border-border-hover"
                placeholder={t<string>("register_field_birth_date_placeholder")}
                value={displayDate}
                onChange={handleBirthDateChange}
                maxLength={10}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t<string>("register_field_password")}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <Lock className="h-3.5 w-3.5 text-[color:var(--color-success)] opacity-70" />
              </div>
              <input
                type="password"
                autoComplete="new-password"
                className="h-11 w-full rounded-[14px] border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]"
                placeholder={t<string>("register_field_password_placeholder")}
                value={personal.password}
                onChange={handlePersonalChange("password")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t<string>("register_field_password_confirm")}
            </label>
            <div className="relative">
              <input
                type="password"
                autoComplete="new-password"
                className="h-11 w-full rounded-[14px] border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]"
                placeholder={t<string>("register_field_password_confirm_placeholder")}
                value={personal.passwordConfirm}
                onChange={handlePersonalChange("passwordConfirm")}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Рендер шага 2: Подтверждение e-mail
   * Поле ввода e-mail с отправкой письма для подтверждения
   */
  const renderStep2 = () => (
    <form id="step2-form" className="space-y-3" onSubmit={handleSubmitStep2}>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t<string>("register_field_work_email")}
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Mail className="h-3.5 w-3.5 text-[color:var(--color-success)] opacity-70" />
          </div>
          <input
            type="email"
            autoComplete="email"
            className="h-11 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]"
            placeholder={t<string>("register_field_work_email_placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground">
        <p>
          {t<string>("register_email_hint")}
        </p>
        {emailStatus === "link_sent" && (
          <>
            <p className="text-primary flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t<string>("register_email_waiting")}
            </p>
            <p className="text-muted-foreground/80">
              {t<string>("register_email_sent")}
            </p>
            <button
              type="button"
              onClick={async () => {
                // Форсируем проверку подтверждения
                try {
                  const res = await fetch("/api/auth/check-email-confirmed", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                  const data = await res.json();
                  if (data.success && data.emailConfirmed) {
                    setEmailStatus("verified");
                    setEmailVerified(true);
                    setRegisterError(null);
                    setStep(3);
                    setMaxStepReached((prev) => (prev < 3 ? 3 : prev));
                  }
                } catch (e) {
                  console.error("[register] Manual email check error", e);
                }
              }}
              className="mt-1 inline-flex items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors self-start"
            >
              {t<string>("register_email_confirmed_btn")}
            </button>
          </>
        )}
        {emailStatus === "verified" && (
          <p className="text-[color:var(--color-success)]">
            {t<string>("register_email_verified")}
          </p>
        )}
      </div>
    </form>
  );

  /**
   * Рендер шага 3: Верификация Telegram
   * Показывает компонент TelegramVerificationStep для подтверждения телефона через Telegram бота
   */
  const renderStep3 = () => {
    if (!registeredUserId || !registeredUserEmail) {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>
              {t<string>("register_error_telegram_data_missing")}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="mb-2 rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
          <p>
            {t<string>("register_telegram_hint")}
          </p>
        </div>
        <TelegramVerificationStep
          onVerified={handleTelegramVerified}
          language={localeForAPI as "ru" | "uk" | "en"}
          userId={registeredUserId}
          email={registeredUserEmail}
        />
      </div>
    );
  };

  /**
   * Рендер шага 4: Успешное завершение регистрации
   * Показывает сообщение об успехе и кнопку перехода в дашборд
   */
  const renderStep4 = () => (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-success)]/10 dark:bg-[color:var(--color-success)]/20 animate-[fadeInScale_250ms_ease-out]">
        <CheckCircle2 className="h-10 w-10 text-[color:var(--color-success)]" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">
          {t<string>("register_success_title")}
        </h3>
        <p className="max-w-md text-sm text-muted-foreground">
          {t<string>("register_success_message")}
        </p>
      </div>
      <Button
        onClick={finishRegistration}
        disabled={isSubmitting}
        className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-8 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.55)] hover:-translate-y-[1px] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t<string>("register_btn_go_to_dashboard_loading")}
          </>
        ) : (
          <>
            {t<string>("register_btn_go_to_dashboard")}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );

  // ---------- Основной рендер компонента ----------
  // Главный контейнер: центрирование по вертикали и горизонтали

  return (
    <main className="min-h-screen pt-[112px] pb-12 flex items-center justify-center bg-background px-4">
      <div className="relative w-full max-w-xl">
        <Card className="relative z-10 w-full rounded-[28px] border border-border bg-card backdrop-blur-[14px] shadow-[var(--shadow-modal)]">
          <CardHeader className="px-8 pt-5 pb-0">
            {step !== 4 && renderTabs()}
            {renderStepTitle()}
          </CardHeader>

          <CardContent className={cn(
            "px-8 py-0 flex items-center justify-center",
            step === 2 ? "min-h-[200px]" : step === 3 ? "min-h-[350px]" : "min-h-[300px]"
          )}>
            <div className="w-full">
              {registerError && (
                <div className={cn(
                  "mb-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-xs",
                  registerError === t<string>("register_waiting_telegram") || registerError.includes(t<string>("register_waiting_telegram").split(" ")[0])
                    ? "border border-primary/30 bg-primary/10 text-primary"
                    : "border border-destructive/30 bg-destructive/10 text-destructive"
                )}>
                  {registerError !== t<string>("register_waiting_telegram") && !registerError.includes(t<string>("register_waiting_telegram").split(" ")[0]) && (
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                  )}
                  <span>{registerError}</span>
                </div>
              )}

              {step === 1 && (
                <div className="flex justify-center">
                  <div className="w-full">
                    {renderStep1()}
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="flex justify-center">
                  <div className="w-full">
                    {renderStep2()}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="flex justify-center">
                  <div className="w-full">
                    {renderStep3()}
                  </div>
                </div>
              )}
              {step === 4 && renderStep4()}
            </div>
          </CardContent>

          {/* Footer с кнопками и ссылкой "Уже есть аккаунт?" */}
          {step === 2 ? (
            <div className="px-8 pb-4 pt-2 mt-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/auth/login")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t<string>("register_already_have_account")} <span className="underline">{t<string>("register_login_link")}</span>
                </button>
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
                  className="inline-flex items-center justify-center h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-6 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.55)] hover:-translate-y-[1px] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSubmitting || emailStatus === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t<string>("register_btn_sending")}
                    </>
                  ) : emailStatus === "link_sent" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t<string>("register_btn_waiting")}
                    </>
                  ) : (
                    <>
                      {t<string>("register_btn_next")}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <CardFooter className="relative flex items-center justify-between px-8 pb-4 pt-2 mt-8 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {step > 1 && step < 4 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t<string>("register_btn_back")}
                  </button>
                )}
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center text-[11px]">
                <span className="text-muted-foreground">{t<string>("register_already_have_account")} </span>
                <button
                  type="button"
                  onClick={() => router.push("/auth/login")}
                  className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Войти
                </button>
              </div>
              <div className="flex items-center gap-2">
                {step === 1 && (
                  <button
                    type="button"
                    onClick={handleNextFromStep1}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.55)] hover:-translate-y-[1px] transition-all duration-200"
                  >
                    {t<string>("register_btn_next")}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </main>
  );
}
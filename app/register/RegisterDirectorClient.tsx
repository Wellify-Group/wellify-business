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
  const { language } = useLanguage();

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
      setRegisterError("Укажите имя и фамилию директора.");
      return;
    }

    if (!personal.birthDate || !personal.birthDate.trim()) {
      setRegisterError("Укажите дату рождения директора.");
      return;
    }

    // Валидация даты рождения: проверка формата и года (от 1920 до текущего года)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(personal.birthDate)) {
      setRegisterError("Неверный формат даты рождения.");
      return;
    }

    const birthDateObj = new Date(personal.birthDate);
    if (isNaN(birthDateObj.getTime())) {
      setRegisterError("Неверная дата рождения.");
      return;
    }

    const currentYear = new Date().getFullYear();
    const minYear = 1920;
    const birthYear = birthDateObj.getFullYear();
    
    if (birthYear < minYear || birthYear > currentYear) {
      setRegisterError(`Год рождения должен быть от ${minYear} до ${currentYear}.`);
      return;
    }

    // Проверка, что дата не в будущем
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (birthDateObj > today) {
      setRegisterError("Дата рождения не может быть в будущем.");
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
            "Этот e-mail уже зарегистрирован. Попробуйте войти в систему."
          );
        } else {
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
        setRegisterError("Не удалось получить данные для завершения регистрации.");
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
          setRegisterError("Не удалось восстановить сессию. Пожалуйста, войдите вручную.");
          return;
        }

        session = signInData.session;
      }

      if (!session?.user) {
        setRegisterError("Сессия не найдена. Пожалуйста, войдите в систему.");
        return;
      }

      // Загружаем профиль через API endpoint (обходит RLS через admin клиент)
      const profileResponse = await fetch('/api/auth/load-profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (profileResponse.status === 401) {
        console.error("[register] Not authenticated in finishRegistration");
        setRegisterError("Сессия истекла. Пожалуйста, войдите заново.");
        return;
      }
      
      if (!profileResponse.ok) {
        console.error("[register] Failed to load profile via API in finishRegistration", profileResponse.status);
        setRegisterError("Не удалось проверить профиль. Попробуйте позже.");
        return;
      }

      const profileData = await profileResponse.json();
      if (!profileData.success || !profileData.user) {
        console.error("[register] Profile not loaded via API in finishRegistration");
        setRegisterError("Не удалось загрузить профиль. Попробуйте позже.");
        return;
      }

      const profile = profileData.user;

      // Проверка условия 1: phone должен быть заполнен
      if (!profile?.phone || profile.phone.trim() === "") {
        setRegisterError("Номер телефона не подтвержден. Пожалуйста, завершите верификацию Telegram.");
        return;
      }

      // Проверка условия 2: telegram_verified должен быть true (строгая проверка)
      // Проверяем telegram_verified - может быть булево true или строка "true"
      const isTelegramVerified = profile?.telegram_verified === true || 
                                 profile?.telegram_verified === "true" ||
                                 profile?.telegram_verified === 1;

      if (!isTelegramVerified) {
        setRegisterError("Telegram не подтвержден. Пожалуйста, завершите верификацию Telegram.");
        return;
      }

      // Оба условия выполнены - сразу редирект в дашборд директора
      router.push("/dashboard/director");
    } catch (e) {
      console.error("finishRegistration error", e);
      setRegisterError(
        "Неизвестная ошибка. Попробуйте войти вручную."
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
        if (!registerError || registerError !== "Ожидание подтверждения данных Telegram...") {
          setRegisterError("Ожидание подтверждения данных Telegram...");
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
      { id: 1, label: "Основные данные" },
      { id: 2, label: "E-mail" },
      { id: 3, label: "Telegram" },
    ];

    return (
      <div className="mb-6 flex items-center justify-between rounded-full border border-white/4 bg-black/20 backdrop-blur-sm px-1 py-1 text-[13px]">
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
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_24px_rgba(88,130,255,0.45)] translate-y-[-1px] font-medium"
                  : reachable
                  ? "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                  : "text-slate-500 cursor-default",
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
      descriptionText =
        "Укажите личные данные директора и задайте пароль для входа.";
    } else if (step === 2) {
      descriptionText =
        "Укажите рабочий e-mail, мы отправим письмо для подтверждения доступа в WELLIFY business.";
    } else {
      // Для шага 3 описание убираем, чтобы не дублировать текст про подтверждение телефона
      descriptionText = null;
    }

    return (
      <>
        <CardTitle className="text-center text-[22px] font-semibold tracking-tight text-foreground">
          Создать аккаунт директора
        </CardTitle>
        {descriptionText && (
          <CardDescription className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
            {descriptionText}
          </CardDescription>
        )}
        {descriptionText && <div className="mt-4"></div>}
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
    // Функция для парсинга ДД.ММ.ГГГГ в YYYY-MM-DD
    const parseDateFromDisplay = (displayStr: string): string | null => {
      if (!displayStr || displayStr.trim() === "") return null;
      const parts = displayStr.split(".");
      if (parts.length !== 3) return null;
      
      const day = parts[0].trim().padStart(2, "0");
      const month = parts[1].trim().padStart(2, "0");
      const year = parts[2].trim();
      
      if (day.length !== 2 || month.length !== 2 || year.length !== 4) {
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
      
      // Ограничиваем длину до 10 символов (ДД.ММ.ГГГГ)
      if (value.length > 10) {
        value = value.slice(0, 10);
      }
      
      // Автоматически добавляем точки после дня и месяца
      if (value.length > 2 && value[2] !== ".") {
        value = value.slice(0, 2) + "." + value.slice(2);
      }
      if (value.length > 5 && value[5] !== ".") {
        value = value.slice(0, 5) + "." + value.slice(5);
      }
      
      // Обновляем отображаемое значение
      setDisplayDate(value);
      
      // Парсим в YYYY-MM-DD только если дата полностью введена (10 символов: ДД.ММ.ГГГГ)
      if (value.length === 10) {
        const parsedDate = parseDateFromDisplay(value);
        if (parsedDate) {
          // Проверяем валидность года (1920 - текущий год)
          const year = parseInt(value.split(".")[2], 10);
          const currentYear = new Date().getFullYear();
          const minYear = 1920;
          
          if (year >= minYear && year <= currentYear) {
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Имя
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <User className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
              </div>
              <input
                type="text"
                className="h-11 w-full rounded-full border border-slate-700/22 bg-[#050814] pl-9 pr-3 text-sm text-foreground placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-teal-400/80 focus:shadow-[0_0_0_1px_rgba(94,234,212,0.5)]"
                value={personal.firstName}
                onChange={handlePersonalChange("firstName")}
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Отчество
            </label>
            <div className="relative">
              <input
                type="text"
                className="h-11 w-full rounded-full border border-slate-700/22 bg-[#050814] px-3 text-sm text-foreground placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-teal-400/80 focus:shadow-[0_0_0_1px_rgba(94,234,212,0.5)]"
                value={personal.middleName}
                onChange={handlePersonalChange("middleName")}
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Фамилия
            </label>
            <div className="relative">
              <input
                type="text"
                className="h-11 w-full rounded-full border border-slate-700/22 bg-[#050814] px-3 text-sm text-foreground placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-teal-400/80 focus:shadow-[0_0_0_1px_rgba(94,234,212,0.5)]"
                value={personal.lastName}
                onChange={handlePersonalChange("lastName")}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Дата рождения
            </label>
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center z-10">
                <Calendar className="h-4 w-4 text-muted-foreground/60 group-focus-within:text-teal-400/80 transition-colors duration-200" />
              </div>
              <input
                type="text"
                inputMode="numeric"
                className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)] hover:border-border-hover"
                placeholder="ДД.ММ.ГГГГ"
                value={displayDate}
                onChange={handleBirthDateChange}
                maxLength={10}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Пароль
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <Lock className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
              </div>
              <input
                type="password"
                autoComplete="new-password"
                className="h-11 w-full rounded-[14px] border border-slate-700/22 bg-[#050814] pl-9 pr-3 text-sm text-foreground placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-teal-400/80 focus:shadow-[0_0_0_1px_rgba(94,234,212,0.5)]"
                placeholder="Минимум 8 символов"
                value={personal.password}
                onChange={handlePersonalChange("password")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Подтверждение пароля
            </label>
            <div className="relative">
              <input
                type="password"
                autoComplete="new-password"
                className="h-11 w-full rounded-[14px] border border-slate-700/22 bg-[#050814] px-3 text-sm text-foreground placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-teal-400/80 focus:shadow-[0_0_0_1px_rgba(94,234,212,0.5)]"
                placeholder="Повторите пароль"
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
    <form id="step2-form" className="space-y-4" onSubmit={handleSubmitStep2}>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Рабочий e-mail
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Mail className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
          </div>
          <input
            type="email"
            autoComplete="email"
            className="h-11 w-full rounded-full border border-slate-700/22 bg-[#050814] pl-9 pr-3 text-sm text-foreground placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-teal-400/80 focus:shadow-[0_0_0_1px_rgba(94,234,212,0.5)]"
            placeholder="you@business.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
        <p>
          Этот адрес будет использоваться для входа, уведомлений по сменам и
          восстановления доступа.
        </p>
        {emailStatus === "link_sent" && (
          <p className="text-emerald-400">
            Письмо с подтверждением отправлено. Перейдите по ссылке в письме,
            после чего мы автоматически продолжим регистрацию.
          </p>
        )}
        {emailStatus === "verified" && (
          <p className="text-emerald-400">
            E-mail подтвержден. Можно переходить к шагу Telegram.
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

  /**
   * Рендер шага 4: Успешное завершение регистрации
   * Показывает сообщение об успехе и кнопку перехода в дашборд
   */
  const renderStep4 = () => (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 animate-[fadeInScale_250ms_ease-out]">
        <CheckCircle2 className="h-10 w-10 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">
          Регистрация завершена успешно!
        </h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Все данные подтверждены. Теперь вы можете перейти в дашборд и начать работу с WELLIFY business.
        </p>
      </div>
      <Button
        onClick={finishRegistration}
        disabled={isSubmitting}
        className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-8 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.55)] hover:-translate-y-[1px] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
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

  // ---------- Основной рендер компонента ----------
  // Главный контейнер: центрирование по вертикали и горизонтали

  return (
    <main className="flex flex-col pt-24 min-h-[calc(100vh-112px)] md:min-h-[calc(100vh-112px)] items-center justify-center bg-background px-4 py-6 md:py-8 overflow-y-auto sm:overflow-y-visible">
      <div className="relative w-full max-w-xl">
        <Card className="relative z-10 w-full rounded-[28px] border border-white/4 bg-gradient-to-b from-[#0B1220] to-[#050712] backdrop-blur-[14px] shadow-[0_24px_80px_rgba(0,0,0,0.70)]">
          <CardHeader className="px-4 py-6 md:px-8 md:py-8">
            {step !== 4 && renderTabs()}
            {renderStepTitle()}
          </CardHeader>

          <CardContent className="px-4 py-4 md:px-8 md:pb-4 md:pt-2 flex items-center justify-center min-h-[300px]">
            <div className="w-full">
              {registerError && (
                <div className={cn(
                  "mb-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-xs",
                  registerError === "Ожидание подтверждения данных Telegram..." || registerError.includes("Ожидание")
                    ? "border border-blue-800/50 bg-blue-950/50 text-blue-100"
                    : "border border-rose-800/80 bg-rose-950/80 text-rose-50"
                )}>
                  {registerError !== "Ожидание подтверждения данных Telegram..." && !registerError.includes("Ожидание") && (
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
                  <div className="w-full max-w-md">
                    {renderStep2()}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="flex justify-center">
                  <div className="w-full max-w-md">
                    {renderStep3()}
                  </div>
                </div>
              )}
              {step === 4 && renderStep4()}
            </div>
          </CardContent>

          <CardFooter className="relative flex items-center justify-between px-4 md:px-8 pb-4 md:pb-6 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {step > 1 && step < 4 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </button>
              )}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center text-[11px]">
              <span className="text-muted-foreground">Уже есть аккаунт? </span>
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
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.55)] hover:-translate-y-[1px] transition-all duration-200"
                >
                  Далее
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {step === 2 && (
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
                  className="inline-flex items-center justify-center min-h-[44px] rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.55)] hover:-translate-y-[1px] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSubmitting || emailStatus === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Отправляем...
                    </>
                  ) : emailStatus === "link_sent" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
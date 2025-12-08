"use client";

import { FormEvent, useEffect, useState } from "react";
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
import { PhoneStep } from "@/components/register/PhoneStep";
import { useLanguage } from "@/components/language-provider";

type Step = 1 | 2 | 3;

type EmailStatus = "idle" | "sending" | "link_sent" | "checking" | "verified" | "error";

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

  // Машина состояний для e-mail шага
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Обратная совместимость (для других частей кода)
  const emailVerified = emailStatus === "verified";
  const emailSent = emailStatus === "link_sent" || emailStatus === "checking" || emailStatus === "verified";
  const isSendingEmail = emailStatus === "sending";

  const [showPassword, setShowPassword] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  // Состояние для завершения регистрации
  const [finishLoading, setFinishLoading] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  // Supabase клиент (не-null, создается один раз через useState с функцией-инициализатором)
  const [supabase] = useState(() => createBrowserSupabaseClient());

  // Очистка старых флагов при первом заходе на регистрацию
  useEffect(() => {
    // Новая регистрация – чистим хвосты
    localStorage.removeItem("register_email");
    localStorage.removeItem("wellify_email_confirmed");
    
    // Сбрасываем в начальное состояние
    setEmailStatus("idle");
    setEmailError(null);
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

  // Периодическая проверка подтверждения email только после отправки ссылки
  useEffect(() => {
    if (emailStatus !== "link_sent" || step !== 2) {
      return;
    }

    let cancelled = false;

    async function checkEmailVerified() {
      if (cancelled) return;

      try {
        setEmailStatus("checking");

        // Сначала пробуем через getUser (если есть сессия)
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.log("[register] getUser error", error);
          // если 401/нет сессии – проверяем через API route
          try {
            const response = await fetch("/api/auth/check-email-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: form.email.trim() }),
            });

            const data = await response.json();

            if (data.success && data.emailVerified) {
              console.log("[register] ✅ Email confirmed via API route!");
              setEmailStatus("verified");
              setEmailError(null);
              cancelled = true;
              return;
            }
          } catch (apiError) {
            console.warn("[register] API check failed:", apiError);
          }
          
          // если 401/нет сессии – значит пользователь ещё не кликал по письму
          setEmailStatus("link_sent");
          return;
        }

        const user = data?.user;

        if (user && user.email_confirmed_at) {
          console.log("[register] ✅ Email confirmed! email_confirmed_at:", user.email_confirmed_at);
          setEmailStatus("verified");
          setEmailError(null);
          cancelled = true;
        } else {
          setEmailStatus("link_sent");
        }
      } catch (e) {
        console.error("[register] checkEmailVerified error", e);
        setEmailStatus("link_sent");
      }
    }

    // Проверяем каждые 10-15 секунд
    checkEmailVerified();
    const interval = setInterval(checkEmailVerified, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [emailStatus, step, form.email]);

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

    // Перед запросом
    setEmailError(null);
    setEmailStatus("sending");
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
          // Пользователь уже существует, отправляем повторное письмо
          const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email: form.email.trim(),
            options: {
              emailRedirectTo: redirectTo,
            },
          });

          if (resendError) {
            setEmailStatus("error");
            setEmailError(resendError.message || "Не удалось отправить письмо");
            return;
          }

          // Успешно отправили повторное письмо
          setEmailStatus("link_sent");
          localStorage.setItem("register_email", form.email.trim());
          return;
        }

        // Другая ошибка
        setEmailStatus("error");
        setEmailError(error.message || "Не удалось отправить письмо");
        return;
      }

      // Успешно отправили письмо
      if (data.user) {
        setEmailStatus("link_sent");
        localStorage.setItem("register_email", form.email.trim());
      }
    } catch (err: any) {
      console.error("Unexpected error sending email:", err);
      setEmailStatus("error");
      setEmailError(err.message || "Произошла ошибка. Попробуйте еще раз.");
    }
  };

  const handleResendEmail = async () => {
    if (!form.email.trim()) {
      setEmailError("Ошибка. Обновите страницу.");
      return;
    }

    setEmailError(null);
    setEmailStatus("sending");

    const redirectTo = `${
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://dev.wellifyglobal.com"
    }/auth/email-confirmed`;

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: form.email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (resendError) {
        setEmailStatus("error");
        setEmailError(resendError.message || "Не удалось отправить письмо");
        return;
      }

      setEmailStatus("link_sent");
      localStorage.setItem("register_email", form.email.trim());
    } catch (err) {
      console.error("Error resending email:", err);
      setEmailStatus("error");
      setEmailError("Не удалось отправить письмо. Попробуйте ещё раз.");
    }
  };

  const handleChangeEmail = async () => {
    // Очищаем состояние
    setEmailStatus("idle");
    setEmailError(null);
    setFormError(null);
    localStorage.removeItem("register_email");
    localStorage.removeItem("wellify_email_confirmed");
    
    // Выходим из сессии
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Error signing out:", err);
    }
  };

  const finishRegistration = async () => {
    try {
      setFinishLoading(true);
      setFinishError(null);

      // 1. Проверяем, что e-mail и телефон подтверждены
      if (emailStatus !== "verified") {
        setFinishError("E-mail ещё не подтверждён. Перейдите по ссылке из письма.");
        return;
      }

      if (!phoneVerified) {
        setFinishError("Телефон ещё не подтверждён.");
        return;
      }

      // 2. Проверяем сессию Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("No authenticated user", userError);
        setFinishError("Пользователь не авторизован. Пожалуйста, зайдите по ссылке из письма и попробуйте ещё раз.");
        return;
      }

      // 3. Формируем полное имя (Фамилия Имя Отчество)
      const fullName = [
        baseData.lastName.trim(),
        baseData.firstName.trim(),
        baseData.middleName?.trim(),
      ]
        .filter(Boolean)
        .join(" ") || null;

      // 4. Обновляем профиль директора в таблице profiles
      // Используем английские названия колонок, которые есть в базе данных
      const profilePayload = {
        email: form.email.trim(),
        full_name: fullName,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, ...profilePayload },
          { onConflict: "id" }
        );

      if (upsertError) {
        console.error("upsert profile error", upsertError);
        setFinishError("Не удалось сохранить профиль. Попробуйте ещё раз.");
        return;
      }

      // 5. Опционально: обновляем телефон в user_metadata
      try {
        await supabase.auth.updateUser({
          data: {
            phone: form.phone.trim(),
          },
        });
      } catch (metadataError) {
        console.warn("Failed to update user metadata:", metadataError);
        // Не критично, если не удалось обновить metadata
      }

      // 6. Редирект на дашборд директора
      router.push("/dashboard/director");
    } catch (e: any) {
      console.error("finishRegistration error", e);
      setFinishError(e?.message ?? "Неизвестная ошибка при завершении регистрации");
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

    // Поле ввода e-mail активно только если idle или error
    const isEmailInputDisabled = emailStatus !== "idle" && emailStatus !== "error";

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

        {/* Статусы */}
        {emailStatus === "idle" && (
          <p className="text-sm text-muted-foreground">
            Введите e-mail и отправьте письмо подтверждения.
          </p>
        )}

        {emailStatus === "sending" && (
          <p className="text-sm text-muted-foreground">Отправляем письмо...</p>
        )}

        {(emailStatus === "link_sent" || emailStatus === "checking") && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {emailStatus === "checking" 
                ? "Проверяем, подтверждён ли e-mail..."
                : `Письмо отправлено на ${form.email.trim()}. Перейдите по ссылке в письме, затем вернитесь сюда. Мы периодически проверяем подтверждение.`}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={emailStatus === "sending" || emailStatus === "checking"}
                onClick={handleChangeEmail}
              >
                Изменить e-mail
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={emailStatus === "sending" || emailStatus === "checking" || !isEmailValid}
                onClick={handleResendEmail}
              >
                Отправить ещё раз
              </Button>
            </div>
          </div>
        )}

        {emailStatus === "verified" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>E-mail подтверждён. Можете перейти к следующему шагу.</span>
          </div>
        )}

        {emailStatus === "error" && emailError && (
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
            disabled={emailStatus === "sending"}
            onClick={() => setStep(1)}
          >
            Назад
          </Button>

          {/* Кнопка "Отправить письмо" показывается только когда idle или error */}
          {(emailStatus === "idle" || emailStatus === "error") && (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={!form.email.trim() || emailStatus === "sending" || !isEmailValid}
              onClick={handleSendEmailVerification}
            >
              {emailStatus === "sending" ? "Отправляем..." : "Отправить письмо"}
            </Button>
          )}

          {/* Кнопка "Далее" показывается только когда verified */}
          {emailStatus === "verified" && (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={isLoading}
              onClick={() => {
                setFormError(null);
                setStep(3);
              }}
            >
              Далее
            </Button>
          )}

          {/* Если не idle/error и не verified, показываем сообщение */}
          {emailStatus !== "idle" && emailStatus !== "error" && emailStatus !== "verified" && (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={true}
              onClick={() => {
                setFormError("Сначала подтвердите e-mail через письмо.");
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

        {finishError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{finishError}</span>
          </div>
        )}

        {renderAlerts()}

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
          <Button
            type="button"
            className="w-full md:w-auto"
            disabled={finishLoading || !phoneVerified || emailStatus !== "verified"}
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

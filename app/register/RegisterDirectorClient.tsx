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
  const [confirmedUserId, setConfirmedUserId] = useState<string | undefined>(undefined);

  const [showPassword, setShowPassword] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Состояние для завершения регистрации
  const [finishLoading, setFinishLoading] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  // Supabase клиент (не-null, создается один раз через useState с функцией-инициализатором)
  const [supabase] = useState(() => createBrowserSupabaseClient());

  // Функция для проверки подтверждения email через API
  const handleConfirmEmail = async () => {
    if (!form.email.trim()) {
      setEmailError("Введите e-mail");
      return;
    }

    try {
      setEmailStatus("checking");
      setEmailError(null);

      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim() }),
      });

      const data = await res.json();

      if (data.confirmed === true) {
        setEmailStatus("verified");
        if (data.userId) {
          setConfirmedUserId(data.userId);
        }
        setEmailError(null);
      } else {
        setEmailStatus("link_sent");
        setEmailError("E-mail ещё не подтверждён. Проверьте почту и перейдите по ссылке из письма.");
      }
    } catch (err) {
      console.error("Error checking email:", err);
      setEmailStatus("link_sent");
      setEmailError("Не удалось проверить статус e-mail. Попробуйте ещё раз.");
    }
  };

  // Очистка старых флагов при первом заходе на регистрацию
  useEffect(() => {
    // Проверяем, есть ли сохранённое состояние регистрации (после возврата с логина)
    const savedState = localStorage.getItem("register_in_progress");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setStep(state.step || 1);
        setForm({
          email: state.email || "",
          phone: state.phone || "",
        });
        if (state.baseData) {
          setBaseData(state.baseData);
        }
        // Восстанавливаем phoneVerified если телефон был подтверждён
        if (state.phoneVerified) {
          setPhoneVerified(true);
        }
        // При восстановлении состояния не проверяем email автоматически
        // Пользователь должен нажать "Я подтвердил email"
      } catch (e) {
        console.error("Error restoring registration state:", e);
        localStorage.removeItem("register_in_progress");
      }
    } else {
      // Новая регистрация – чистим хвосты
      localStorage.removeItem("register_email");
      localStorage.removeItem("wellify_email_confirmed");
      
      // Сбрасываем в начальное состояние
      setEmailStatus("idle");
      setEmailError(null);
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

  // Сохранение состояния регистрации в localStorage
  useEffect(() => {
    if (step > 1 || form.email || form.phone) {
      const state = {
        step,
        email: form.email,
        phone: form.phone,
        baseData,
        phoneVerified,
      };
      localStorage.setItem("register_in_progress", JSON.stringify(state));
    }
  }, [step, form.email, form.phone, baseData, phoneVerified]);

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

  const handleSendEmailLink = async () => {
    try {
      setEmailError(null);
      setEmailStatus("sending");

    const redirectTo = `${
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://dev.wellifyglobal.com"
      }/auth/callback`;

      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: baseData.password,
        options: {
          data: {
            first_name: baseData.firstName,
            last_name: baseData.lastName,
            middle_name: baseData.middleName,
            birth_date: baseData.birthDate,
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        // Если пользователь уже существует, отправляем повторное письмо
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
            setEmailStatus("error");
            setEmailError(resendError.message || "Не удалось отправить письмо.");
            return;
          }
        } else {
          setEmailStatus("error");
          setEmailError(error.message || "Не удалось отправить письмо.");
          return;
        }
      }

      setEmailStatus("link_sent");
    } catch (e: any) {
      setEmailStatus("error");
      setEmailError(e?.message ?? "Не удалось отправить письмо.");
    }
  };

  const handleResendEmail = async () => {
    // Используем ту же функцию, что и для первоначальной отправки
    await handleSendEmailLink();
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

      // Проверяем, что email подтверждён и телефон подтверждён
      if (emailStatus !== "verified") {
        setFinishError("E-mail должен быть подтверждён. Вернитесь на предыдущий шаг.");
        return;
      }

      if (!phoneVerified) {
        setFinishError("Телефон ещё не подтверждён.");
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
      localStorage.removeItem("register_in_progress");

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
    const isEmailInputDisabled = emailStatus === "verified" || emailStatus === "link_sent" || emailStatus === "checking";

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

        {/* БАННЕРЫ */}
        {emailStatus === "link_sent" && (
          <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Мы отправили письмо. Подтвердите email и вернитесь на страницу.
          </div>
        )}

        {emailStatus === "verified" && (
          <p className="mt-3 text-sm text-emerald-400">
            E-mail подтверждён. Можете перейти к следующему шагу.
          </p>
        )}

        {emailError && (
          <p className="mt-2 text-sm text-red-400">
            {emailError}
          </p>
        )}

        {/* КНОПКИ ПОД ПОЛЕМ E-MAIL */}
        {/* Показываем кнопки только если email ещё не подтверждён */}
        {emailStatus === "link_sent" && (
          <div className="mt-4 flex gap-3">
            {/* Изменить e-mail */}
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleChangeEmail}
              disabled={false}
            >
              Изменить e-mail
            </Button>

            {/* Кнопка "Я подтвердил email" */}
            <Button
              type="button"
              className="flex-1"
              onClick={handleConfirmEmail}
              disabled={false}
            >
              Я подтвердил email
            </Button>
          </div>
        )}

        {emailStatus === "link_sent" && (
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
              disabled={false}
            >
              Отправить письмо ещё раз
            </Button>
          </div>
        )}

        {emailStatus === "checking" && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Проверяем статус e-mail...
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
              disabled={!form.email.trim() || !isEmailValid}
              onClick={handleSendEmailLink}
            >
              Отправить письмо
            </Button>
          )}

          {/* Кнопка "Далее" показывается только когда email подтверждён */}
          {emailStatus === "verified" && (
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

  const renderStep3 = () => {

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

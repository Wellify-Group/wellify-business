"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
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
import type { SupabaseClient } from "@supabase/supabase-js";

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

export default function RegisterDirectorPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
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
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // клиент Supabase
  const supabase = useMemo<SupabaseClient | null>(() => {
    try {
      return createBrowserSupabaseClient();
    } catch (error) {
      console.error("Failed to create Supabase client:", error);
      return null;
    }
  }, []);

  // Сброс ошибок при смене шага
  useEffect(() => {
    setFormError(null);
    setFormSuccess(null);
    if (step !== 2) {
      setEmailSent(false);
      setEmailVerified(false);
    }
  }, [step]);

  // ПОЛЛИНГ подтверждения e-mail и подтягивание профиля
  useEffect(() => {
    if (!supabase || step !== 2 || !emailSent || emailVerified) return;

    let cancelled = false;

    const checkEmailAndProfile = async () => {
      if (cancelled || emailVerified) return;

      try {
        // Сначала проверяем localStorage для быстрого обновления
        try {
          const isConfirmed = localStorage.getItem("wellify_email_confirmed") === "true";
          if (isConfirmed) {
            // Если флаг установлен, проверяем профиль для подтверждения
          } else {
            // Если флага нет, продолжаем обычную проверку
          }
        } catch (e) {
          // localStorage недоступен, продолжаем обычную проверку
        }

        // 1. Получаем пользователя
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        // 2. Если ошибка - логируем и выходим из итерации
        if (userError) {
          console.error("Error getting user during email verification polling:", userError);
          return;
        }

        // 3. Если user нет - просто выходим из итерации (значит, пользователь ещё не подтвердил почту)
        if (!user || cancelled || emailVerified) {
          return;
        }

        // Проверяем, подтвержден ли email в auth
        if (user.email_confirmed_at) {
          setEmailVerified(true);
          cancelled = true;
          return;
        }

        // 4. Если user есть - читаем профиль
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select(
            "email_verified, first_name, last_name, middle_name, birth_date, email, phone",
          )
          .eq("id", user.id)
          .maybeSingle();

        // 5. Если profileError - логируем и выходим из итерации
        if (profileError) {
          console.error("Error loading profile during email verification polling:", profileError);
          return;
        }

        if (!profile || cancelled || emailVerified) {
          return;
        }

        // 6. Если profile?.email_verified true
        if (profile.email_verified && !cancelled && !emailVerified) {
          // вызываем setEmailVerified(true)
          setEmailVerified(true);

          // опционально подтягиваем данные профиля обратно в baseData, чтобы всё было консистентно
          setBaseData((prev) => ({
            ...prev,
            firstName: profile.first_name ?? prev.firstName,
            lastName: profile.last_name ?? prev.lastName,
            middleName: profile.middle_name ?? prev.middleName,
            birthDate: profile.birth_date ?? prev.birthDate,
          }));

          setForm((prev) => ({
            ...prev,
            email: prev.email || profile.email || "",
            phone: prev.phone || profile.phone || "",
          }));

          // Останавливаем polling после успешного подтверждения
          cancelled = true;
        }
      } catch (error) {
        console.error("Error polling email verification:", error);
      }
    };

    // Слушаем события localStorage для мгновенного обновления
    const handleStorageChange = () => {
      if (!emailVerified) {
        checkEmailAndProfile().catch(console.error);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("emailConfirmed", handleStorageChange);

    // первый запуск сразу
    checkEmailAndProfile().catch(console.error);

    // затем - каждые 4 секунды (3-5 секунд по требованиям)
    const intervalId = window.setInterval(() => {
      if (!cancelled && !emailVerified) {
        checkEmailAndProfile().catch(console.error);
      } else {
        window.clearInterval(intervalId);
      }
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("emailConfirmed", handleStorageChange);
    };
  }, [supabase, step, emailSent, emailVerified]);

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
    if (form.phone.replace(/\D/g, "").length < 10) {
      setFormError("Укажите корректный телефон.");
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
      setFormError("Укажите e-mail.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setFormError("Укажите корректный e-mail.");
      return;
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setFormError("Ошибка конфигурации. Обратитесь к администратору.");
      console.error("Missing Supabase env");
      return;
    }

    if (!supabase) {
      setFormError("Ошибка инициализации. Обновите страницу.");
      return;
    }

    setIsSendingEmail(true);
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
        // Если пользователь уже существует, пробуем отправить письмо заново
        if (error.message?.includes("already registered") || error.message?.includes("already exists")) {
          // Пробуем resend confirmation
          const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email: form.email.trim(),
            options: {
              emailRedirectTo: redirectTo,
            },
          });

          if (resendError) {
            setFormError(resendError.message || "Не удалось отправить письмо");
            setIsSendingEmail(false);
            return;
          }

          // Письмо переотправлено
          setEmailSent(true);
          setEmailVerified(false);
          setIsSendingEmail(false);
          return;
        }

        setFormError(error.message || "Не удалось отправить письмо");
        setIsSendingEmail(false);
        return;
      }

      // Письмо отправлено успешно
      setEmailSent(true);
      setEmailVerified(false);
    } catch (err: any) {
      console.error("Unexpected error sending email:", err);
      setFormError(err.message || "Произошла ошибка. Попробуйте еще раз.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!validatePhone()) {
      return;
    }

    if (!supabase) {
      setFormError("Ошибка инициализации. Обновите страницу.");
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setIsLoading(false);
        setFormError(
          "Пользователь не авторизован. Пожалуйста, войдите в систему.",
        );
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone: form.phone.trim() })
        .eq("id", user.id);

      setIsLoading(false);

      if (updateError) {
        console.error("Error updating phone:", updateError);
        setFormError(
          updateError.message || "Ошибка при сохранении телефона",
        );
        return;
      }

      router.push("/dashboard/director");
    } catch (error) {
      console.error("Error updating phone:", error);
      setIsLoading(false);
      setFormError(
        "Произошла ошибка при сохранении телефона. Попробуйте ещё раз.",
      );
    }
  };

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

    // Кнопка "Далее" доступна только если emailVerified === true и не идёт загрузка
    const canGoNextFromEmailStep = emailVerified && !isLoading && !isSendingEmail;

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
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
            placeholder="you@example.com"
          />
        </div>

        {emailSent && !emailVerified && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Письмо с подтверждением отправлено на {form.email.trim()}. Перейдите
            по ссылке в письме. После подтверждения страница автоматически
            обновит статус.
          </div>
        )}
        {emailVerified && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Поздравляем! Ваша почта подтверждена. Можете переходить к следующему шагу.</span>
          </div>
        )}

        {renderAlerts()}

        <div className="mt-4 flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full md:w-auto"
            disabled={isSendingEmail}
            onClick={() => setStep(1)}
          >
            Назад
          </Button>

        {!emailSent ? (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={!form.email.trim() || isSendingEmail || !isEmailValid}
              onClick={handleSendEmailVerification}
            >
              {isSendingEmail ? "Отправляем..." : "Подтвердить e-mail"}
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={!canGoNextFromEmailStep}
              onClick={() => setStep(3)}
            >
              Далее
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <form onSubmit={handleFinish} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Телефон <span className="text-destructive">*</span>
        </label>
        <input
          value={form.phone}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, phone: e.target.value }))
          }
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
          placeholder="+38 (0XX) XXX-XX-XX"
        />
      </div>

      {renderAlerts()}

      <div className="mt-4 flex flex-col gap-2 md:flex-row md:justify-between">
        <Button
          type="button"
          variant="outline"
          className="w-full md:w-auto"
          disabled={isLoading}
          onClick={() => setStep(2)}
        >
          Назад
        </Button>
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? "Завершаем..." : "Завершить регистрацию"}
        </Button>
      </div>
    </form>
  );

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

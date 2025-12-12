"use client";

import { useState, FormEvent, ChangeEvent } from "react";
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
import { User, Calendar, Mail, Lock, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

type Step = 1 | 2 | 3;

interface PersonalForm {
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  password: string;
  passwordConfirm: string;
}

interface RegisterResponse {
  success: boolean;
  error?: string;
  errorCode?: string;
  user?: {
    id: string;
    email: string;
    fullName?: string;
    role?: string;
  };
  business?: {
    id: string;
    name: string;
    companyCode: string;
  };
}

const telegramAppUrl = process.env.NEXT_PUBLIC_TELEGRAM_APP_URL;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registeredUserEmail, setRegisteredUserEmail] = useState<string | null>(
    null
  );

  // ---------- helpers ----------

  const handlePersonalChange =
    (field: keyof PersonalForm) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setPersonal((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleNextFromStep1 = () => {
    setRegisterError(null);

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
    setStep(2);
    setMaxStepReached((prev) => (prev < 2 ? 2 : prev));
  };

  const handleSubmitStep2 = async (e: FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!email.trim()) {
      setRegisterError("Укажите рабочий e-mail.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullName = [
        personal.firstName.trim(),
        personal.middleName.trim(),
        personal.lastName.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const payload = {
        email: email.trim(),
        password: personal.password,
        fullName: fullName || undefined,
        firstName: personal.firstName.trim() || undefined,
        lastName: personal.lastName.trim() || undefined,
        middleName: personal.middleName.trim() || undefined,
        birthDate: personal.birthDate || undefined,
        language,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: RegisterResponse = await res.json();

      if (!res.ok || !data.success) {
        setRegisterError(
          data?.error ||
            "Не удалось создать аккаунт директора. Попробуйте ещё раз."
        );
        setIsSubmitting(false);
        return;
      }

      setRegisterSuccess(true);
      setRegisteredUserEmail(data.user?.email || email.trim());
      setIsSubmitting(false);

      setStep(3);
      setMaxStepReached(3);
    } catch (err) {
      console.error("Register error", err);
      setRegisterError("Внутренняя ошибка. Попробуйте позже.");
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setRegisterError(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  const canGoToStep = (target: Step) => {
    return target <= maxStepReached;
  };

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

  const renderStepBadge = () => (
    <div className="mb-2 flex items-center justify-center">
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-300">
        Шаг {step} из 3
      </span>
    </div>
  );

  const renderStepTitle = () => (
    <>
      <CardTitle className="text-center text-[22px] font-semibold tracking-tight text-zinc-50">
        Создать аккаунт директора
      </CardTitle>
      <CardDescription className="mt-2 text-center text-sm leading-relaxed text-zinc-400">
        {step === 1 &&
          "Укажите личные данные директора и задайте пароль для входа."}
        {step === 2 &&
          "Укажите рабочий e-mail, на который будут приходить уведомления и доступ в WELLIFY business."}
        {step === 3 &&
          "Подтвердите номер телефона директора через Telegram, чтобы завершить регистрацию и защитить аккаунт."}
      </CardDescription>
    </>
  );

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
              placeholder="Иван"
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
              placeholder="Александрович"
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
              placeholder="Петров"
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
              type="password"
              autoComplete="new-password"
              className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
              placeholder="Минимум 8 символов"
              value={personal.password}
              onChange={handlePersonalChange("password")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Подтверждение пароля
          </label>
          <div className="relative">
            <input
              type="password"
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
            className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
            placeholder="you@business.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2 text-xs text-zinc-500">
        <p>
          Этот адрес будет использоваться для входа, уведомлений по сменам и
          восстановления доступа.
        </p>
      </div>
    </form>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 text-sm text-zinc-200">
        <p className="font-medium mb-2">
          Шаг 3. Подтверждение телефона через Telegram
        </p>
        <p className="text-zinc-400 mb-2">
          Откройте нашего бота WELLIFY business в Telegram, отправьте свой номер
          телефона и дождитесь автоматического завершения регистрации.
        </p>
        {registeredUserEmail && (
          <p className="text-xs text-zinc-500">
            Аккаунт директора успешно создан для e-mail:{" "}
            <span className="font-semibold text-zinc-200">
              {registeredUserEmail}
            </span>
            .
          </p>
        )}
      </div>

      <div className="space-y-3">
        {telegramAppUrl ? (
          <>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 text-sm text-zinc-200">
              <p className="mb-1 font-medium">Откройте бота в Telegram</p>
              <p className="text-xs text-zinc-400 mb-3">
                Наведите камеру на QR-код или нажмите кнопку ниже, чтобы
                открыть бота WELLIFY business в Telegram.
              </p>
              {/* Здесь можно потом встроить реальный QR-код */}
              <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-700/80 bg-zinc-900/60 py-8 text-xs text-zinc-500">
                QR-код будет отображаться здесь
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                window.open(telegramAppUrl, "_blank", "noopener,noreferrer");
              }}
              className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-[var(--accent-primary,#2563eb)] text-sm font-semibold text-white shadow-[0_18px_60px_rgba(37,99,235,0.55)] transition hover:bg-[var(--accent-primary-hover,#1d4ed8)]"
            >
              Открыть бота в Telegram
            </Button>
          </>
        ) : (
          <div className="rounded-2xl border border-rose-800/70 bg-rose-950/80 p-4 text-xs text-rose-100">
            <p className="font-semibold mb-1">
              NEXT_PUBLIC_TELEGRAM_APP_URL не настроен в .env.local
            </p>
            <p className="text-rose-200/80">
              Добавьте переменную окружения{" "}
              <span className="font-mono text-[11px]">
                NEXT_PUBLIC_TELEGRAM_APP_URL
              </span>{" "}
              с ссылкой на бота WELLIFY business в Telegram и пересоберите
              приложение, чтобы включить этот шаг.
            </p>
          </div>
        )}
      </div>

      <div className="pt-1 text-center text-[11px] text-zinc-500">
        После подтверждения телефона регистрация директора будет завершена.
      </div>
    </div>
  );

  // ---------- main render ----------

  return (
    <main className="flex min-h-screen items-start justify-center bg-background px-4 pt-28 pb-10">
      <div className="relative w-full max-w-3xl">
        <Card className="relative z-10 w-full rounded-[32px] border border-border bg-card shadow-modal backdrop-blur-2xl">
          <CardHeader className="px-10 pt-7 pb-4">
            {renderTabs()}
            {renderStepTitle()}
          </CardHeader>

          <CardContent className="px-10 pb-4 pt-1">
            {registerError && (
              <div className="mb-4 rounded-2xl border border-rose-800/80 bg-rose-950/80 px-4 py-3 text-xs text-rose-50">
                {registerError}
              </div>
            )}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </CardContent>

          <CardFooter className="relative flex items-center justify-between px-10 pb-6 pt-2 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              {step > 1 && (
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
                onClick={() => router.push("/login")}
                className="font-medium text-zinc-200 underline-offset-4 hover:underline"
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
              {step === 2 && (
                <button
                  type="button"
                  onClick={(e) => {
                    const form = document.getElementById('step2-form') as HTMLFormElement;
                    if (form) {
                      form.requestSubmit();
                    }
                  }}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary,#2563eb)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Создание...
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

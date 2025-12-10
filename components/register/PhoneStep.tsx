"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Типы для ответов API
interface SendVerificationResponse {
  success?: boolean;
  sid?: string;
  error?: string;
  message?: string;
  code?: number | null;
}

interface CheckVerificationResponse {
  success?: boolean;
  status?: string;
  error?: string;
  message?: string;
}

type PhoneStepProps = {
  // текущий номер (если пользователь вернулся на шаг)
  initialPhone?: string | null;
  // текущая локаль интерфейса ("ru" | "uk" | "en" | ...)
  locale: string;
  // email пользователя (для поиска пользователя в БД, если не залогинен)
  email?: string | null;
  // коллбэк, который вызываем при успешной верификации
  onPhoneVerified: (phone: string) => void;
};

export function PhoneStep({ initialPhone, locale, email, onPhoneVerified }: PhoneStepProps) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"enter-phone" | "enter-code">("enter-phone");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Обновляем телефон при изменении initialPhone
  useEffect(() => {
    if (initialPhone !== undefined) {
      setPhone(initialPhone ?? "");
    }
  }, [initialPhone]);

  // Валидация телефона: начинается с +, только цифры после +, длина 8-15 символов
  function validatePhone(phoneValue: string): string | null {
    const trimmed = phoneValue.trim();
    
    if (!trimmed) {
      return "Введите номер телефона";
    }

    if (!trimmed.startsWith("+")) {
      return "Номер должен начинаться с + (международный формат)";
    }

    // Проверяем, что после + только цифры
    const digitsOnly = trimmed.slice(1);
    if (!/^\d+$/.test(digitsOnly)) {
      return "Номер может содержать только + и цифры";
    }

    // Проверяем длину (минимум 8 символов после +, максимум 15)
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      return "Номер должен содержать от 8 до 15 цифр после +";
    }

    return null;
  }

  // Валидация кода: только цифры, длина 4-8 символов
  function validateCode(codeValue: string): string | null {
    const trimmed = codeValue.trim();

    if (!trimmed) {
      return "Введите код из SMS";
    }

    if (!/^\d+$/.test(trimmed)) {
      return "Код должен содержать только цифры";
    }

    if (trimmed.length < 4 || trimmed.length > 8) {
      return "Код должен содержать от 4 до 8 цифр";
    }

    return null;
  }

  async function handleSendCode() {
    setError(null);
    setSuccess(null);

    // Валидация телефона
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    const trimmedPhone = phone.trim();
    setIsSendingCode(true);

    try {
      const res = await fetch("/api/auth/phone/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmedPhone, action: "signup" }),
      });

      const data: SendVerificationResponse = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSuccess(data.message || "Код отправлен на ваш номер.");
        setStep("enter-code");
      } else {
        // Обработка ошибок
        const errorMessage = data.error || data.message || "Не удалось отправить код. Повторите попытку.";
        setError(errorMessage);
      }
    } catch (e) {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    setError(null);
    setSuccess(null);

    // Валидация телефона и кода
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    const codeError = validateCode(code);
    if (codeError) {
      setError(codeError);
      return;
    }

    const trimmedPhone = phone.trim();
    const trimmedCode = code.trim();

    setIsVerifyingCode(true);

    try {
      const res = await fetch("/api/auth/phone/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: trimmedPhone, 
          code: trimmedCode,
          email: email || null, // Передаём email для поиска пользователя, если не залогинен
        }),
      });

      const data: CheckVerificationResponse = await res.json().catch(() => ({}));

      if (res.ok && data.success === true) {
        // Телефон успешно верифицирован
        setIsPhoneVerified(true); // Состояние, которое управляет финальным уведомлением
        onPhoneVerified(trimmedPhone); // Вызываем внешний коллбэк, который перечитает профиль
      } else if (res.status === 400) {
        // Код неверный или истёк
        const errorMessage = data.error || data.message || "Код неверный или истёк. Попробуйте ещё раз.";
        setError(errorMessage);
      } else if (res.status === 429) {
        // Rate limit
        const errorMessage = data.error || data.message || "Слишком много попыток. Попробуйте позже.";
        setError(errorMessage);
      } else if (res.status === 500) {
        // Серверная ошибка
        setError("Сервис верификации временно недоступен. Попробуйте позже.");
      } else {
        // Другие ошибки
        const errorMessage = data.error || data.message || "Не удалось проверить код. Попробуйте ещё раз.";
        setError(errorMessage);
      }
    } catch (e) {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setIsVerifyingCode(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="mb-1.5 block text-sm font-medium">
          Номер телефона (в международном формате) <span className="text-destructive">*</span>
        </label>
        <input
          type="tel"
          placeholder="+380671234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={step === "enter-code" || isSendingCode || isVerifyingCode || isPhoneVerified}
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          Укажите номер в формате E.164: +{`{код_страны}`}{`{номер}`}. Любая страна поддерживается.
        </p>
      </div>

      {step === "enter-code" && (
        <div className="space-y-2">
          <label className="mb-1.5 block text-sm font-medium">Код из SMS</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="123456"
            value={code}
            onChange={(e) => {
              // Разрешаем только цифры
              const value = e.target.value.replace(/\D/g, "");
              setCode(value);
            }}
            disabled={isVerifyingCode || isPhoneVerified}
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && !isPhoneVerified && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex gap-3">
        {step === "enter-phone" && (
          <Button
            type="button"
            onClick={handleSendCode}
            disabled={isSendingCode || isPhoneVerified}
            className="w-full"
          >
            {isSendingCode ? "Отправляем..." : "Отправить код"}
          </Button>
        )}

        {step === "enter-code" && (
          <div className="flex gap-3 w-full">
            {/* Кнопка "Изменить номер" */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep("enter-phone");
                setCode("");
                setSuccess(null);
                setError(null);
              }}
              disabled={isVerifyingCode || isPhoneVerified}
              className="flex-1"
            >
              Изменить номер
            </Button>
            {/* Кнопка "Подтвердить телефон" */}
            <Button
              type="button"
              onClick={handleVerifyCode}
              disabled={isVerifyingCode || isPhoneVerified}
              className="flex-1"
            >
              {isVerifyingCode ? "Подтверждение..." : "Подтвердить телефон"}
            </Button>
          </div>
        )}

        {isPhoneVerified && (
          <div className="w-full flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Телефон успешно подтверждён.</span>
          </div>
        )}
      </div>
    </div>
  );
}

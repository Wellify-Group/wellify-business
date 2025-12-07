"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const phoneSchema = z
  .string()
  .min(8, "Введите номер телефона")
  // Формат E.164: + и от 8 до 15 цифр, первая цифра не 0
  .regex(/^\+[1-9]\d{7,14}$/, "Номер должен быть в формате +XXXXXXXX");

type PhoneStepProps = {
  // текущий номер (если пользователь вернулся на шаг)
  initialPhone?: string | null;
  // текущая локаль интерфейса ("ru" | "uk" | "en" | ...)
  locale: string;
  // коллбэк, который вызываем при успешной верификации
  onPhoneVerified: (phone: string) => void;
};

export function PhoneStep({ initialPhone, locale, onPhoneVerified }: PhoneStepProps) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"enter-phone" | "enter-code">("enter-phone");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Обновляем телефон при изменении initialPhone
  useEffect(() => {
    if (initialPhone !== undefined) {
      setPhone(initialPhone ?? "");
    }
  }, [initialPhone]);

  async function handleSendCode() {
    setError(null);
    setSuccess(null);

    let parsedPhone: string;
    try {
      parsedPhone = phoneSchema.parse(phone.trim());
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message ?? "Неверный номер телефона");
      } else {
        setError("Неверный номер телефона");
      }
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/phone/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: parsedPhone,
          locale,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Не удалось отправить код. Повторите попытку.");
        return;
      }

      setSuccess("Код отправлен. Введите его из SMS.");
      setStep("enter-code");
    } catch (e) {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerifyCode() {
    setError(null);
    setSuccess(null);

    if (!code.trim()) {
      setError("Введите код из SMS");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/phone/check-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          code: code.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Не удалось проверить код. Попробуйте ещё раз.");
        return;
      }

      const data = await res.json();
      if (data.valid) {
        setSuccess("Телефон успешно подтверждён.");
        onPhoneVerified(phone.trim());
      } else {
        setError("Неверный код. Попробуйте ещё раз.");
      }
    } catch (e) {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setIsVerifying(false);
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
          disabled={step === "enter-code" || isSending || isVerifying}
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
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
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isVerifying}
            className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-transparent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
          />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
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
            disabled={isSending}
            className="w-full"
          >
            {isSending ? "Отправка..." : "Отправить код"}
          </Button>
        )}

        {step === "enter-code" && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep("enter-phone");
                setCode("");
                setSuccess(null);
                setError(null);
              }}
              disabled={isVerifying}
              className="w-1/3"
            >
              Изменить номер
            </Button>
            <Button
              type="button"
              onClick={handleVerifyCode}
              disabled={isVerifying}
              className="w-2/3"
            >
              {isVerifying ? "Проверка..." : "Подтвердить телефон"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}


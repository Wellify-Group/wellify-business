"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface TelegramVerificationStepProps {
  onVerified: () => void;
  language?: "ru" | "uk" | "en";
  userId: string;
  email: string;
}

type SessionStatus = {
  status: "pending" | "completed" | "expired";
  phone: string | null;
  phoneVerified?: boolean;
  telegramVerified?: boolean;
};

const TELEGRAM_API_URL = process.env.NEXT_PUBLIC_TELEGRAM_API_URL;

export function TelegramVerificationStep({
  onVerified,
  language = "ru",
  userId,
  email,
}: TelegramVerificationStepProps) {
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const [phoneVerified, setPhoneVerified] = useState(false);

  const texts = {
    ru: {
      waiting: "Ждём подтверждения телефона в Telegram…",
      expired: "Сессия истекла. Создайте новую ссылку и попробуйте ещё раз.",
      openHint:
        "Нажмите на QR-код или отсканируйте его камерой, чтобы открыть бота WELLIFY business в Telegram.",
      steps: [
        "Откройте бота WELLIFY business.",
        "Нажмите «Старт» (если требуется).",
        "Нажмите «Отправить номер телефона».",
        "Дождитесь подтверждения и вернитесь сюда.",
      ],
      successTitle: "Телефон подтверждён",
      successText:
        "Номер телефона директора успешно подтверждён через Telegram.",
      successButton: "Завершить регистрацию",
      newLink: "Создать новую ссылку",
    },
    uk: {
      waiting: "Чекаємо підтвердження телефону в Telegram…",
      expired: "Сесію завершено. Створіть нове посилання і спробуйте ще раз.",
      openHint:
        "Натисніть на QR-код або відскануйте його камерою, щоб відкрити бота WELLIFY business у Telegram.",
      steps: [
        "Відкрийте бота WELLIFY business.",
        "Натисніть «Старт» (якщо потрібно).",
        "Натисніть «Надіслати номер телефону».",
        "Дочекайтеся підтвердження та поверніться сюди.",
      ],
      successTitle: "Телефон підтверджено",
      successText:
        "Номер телефону директора успішно підтверджено через Telegram.",
      successButton: "Завершити реєстрацію",
      newLink: "Створити нове посилання",
    },
    en: {
      waiting: "Waiting for phone confirmation in Telegram…",
      expired: "Session expired. Create a new link and try again.",
      openHint:
        "Click the QR code or scan it with your camera to open the WELLIFY business bot in Telegram.",
      steps: [
        "Open the WELLIFY business bot.",
        "Press “Start” (if required).",
        "Press “Send phone number”.",
        "Wait for confirmation and return here.",
      ],
      successTitle: "Phone confirmed",
      successText: "Director’s phone number has been confirmed via Telegram.",
      successButton: "Finish registration",
      newLink: "Create new link",
    },
  }[language];

  // 1. Создаём Telegram-сессию
  useEffect(() => {
    const createSession = async () => {
      if (!userId || !email) {
        setError(
          "Не удалось получить данные регистрации. Вернитесь на предыдущий шаг."
        );
        return;
      }

      if (!TELEGRAM_API_URL) {
        setError(
          "NEXT_PUBLIC_TELEGRAM_API_URL не настроен. Обратитесь к администратору."
        );
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const resp = await fetch("/api/telegram/link-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, email, language }),
        });

        if (!resp.ok) {
          setError(
            `Не удалось подготовить ссылку для Telegram (код ${resp.status}).`
          );
          return;
        }

        const json = (await resp.json()) as {
          sessionToken: string;
          telegramLink: string;
        };

        setSessionToken(json.sessionToken);
        setTelegramLink(json.telegramLink);
        setPolling(true);
      } catch (e) {
        console.error("[telegram] link-session error", e);
        setError("Произошла внутренняя ошибка при создании сессии Telegram.");
      } finally {
        setLoading(false);
      }
    };

    createSession();
  }, [userId, email, language]);

  // 2. Polling статуса
  useEffect(() => {
    if (!sessionToken || !polling) return;

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (cancelled) return;

      try {
        const resp = await fetch(`/api/telegram/session-status/${sessionToken}`);
        if (!resp.ok) return;

        const raw = await resp.json();
        console.log("[telegram] raw session-status", raw);

        const normalized: SessionStatus = {
          status:
            (raw.status as SessionStatus["status"]) ||
            (raw.sessionStatus as SessionStatus["status"]) ||
            "pending",
          phone:
            raw.phone ??
            raw.phone_number ??
            raw.phoneNumber ??
            raw.telegram_phone ??
            null,
          phoneVerified:
            raw.phoneVerified ??
            raw.phone_verified ??
            raw.phoneConfirmed ??
            raw.phone_confirmed ??
            false,
          telegramVerified:
            raw.telegramVerified ?? raw.telegram_verified ?? false,
        };

        setStatus(normalized);

        const isVerified =
          normalized.phoneVerified ||
          (normalized.status === "completed" &&
            normalized.phone &&
            normalized.phone.length > 0);

        if (isVerified) {
          setPhoneVerified(true);
          setStatus({
            ...normalized,
            status: "completed",
            phoneVerified: true,
          });

          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          // !!! КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ВЫЗЫВАЕМ onVerified() ЗДЕСЬ !!!
          if (!cancelled) {
              onVerified(); 
          }
          return;
        }

        if (normalized.status === "expired") {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (e) {
        console.error("[telegram] session-status error", e);
      }
    };

    // первый запрос сразу, потом интервал
    poll();
    intervalId = setInterval(poll, 3000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionToken, polling, onVerified]);

  const handleOpenTelegram = () => {
    if (!telegramLink) return;
    if (typeof window !== "undefined") {
      window.open(telegramLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleCreateNewLink = () => {
    setSessionToken(null);
    setTelegramLink(null);
    setStatus(null);
    setPhoneVerified(false);
    setError(null);
    setPolling(false);
    // useEffect с userId/email/language сам заново создаст сессию
  };

  // 3. Успешное подтверждение телефона
  if (phoneVerified) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-50">
          {texts.successTitle}
        </h3>
        <p className="max-w-md text-sm text-zinc-400">{texts.successText}</p>
        <Button
          size="lg"
          className="mt-2 w-full max-w-xs"
          onClick={onVerified}
        >
          {texts.successButton}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {telegramLink && (
        <>
          <button
            type="button"
            onClick={handleOpenTelegram}
            className="rounded-3xl bg-white p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          >
            <QRCode value={telegramLink} size={200} />
          </button>

          <p className="max-w-md text-center text-xs text-zinc-400">
            {texts.openHint}
          </p>

          <ol className="mt-1 space-y-1 text-[11px] text-zinc-500">
            {texts.steps.map((line, idx) => (
              <li key={idx}>
                {idx + 1}. {line}
              </li>
            ))}
          </ol>
        </>
      )}

      {!telegramLink && !error && (
        <p className="text-xs text-zinc-500">
          {loading
            ? "Готовим ссылку для Telegram…"
            : "Подготовка ссылки для Telegram…"}
        </p>
      )}

      {status && !phoneVerified && status.status === "pending" && (
        <div className="mt-3 inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-300">
          {texts.waiting}
        </div>
      )}

      {status && status.status === "expired" && (
        <div className="mt-3 flex flex-col items-center gap-2 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/50 bg-amber-950/70 px-3 py-1.5 text-[11px] text-amber-200">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{texts.expired}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCreateNewLink}
          >
            {texts.newLink}
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-800/80 bg-rose-950/80 px-4 py-3 text-xs text-rose-50">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
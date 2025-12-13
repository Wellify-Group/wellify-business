"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"; 

interface TelegramVerificationStepProps {
  onVerified: (phone?: string) => void;
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
      successTitle: "Поздравляем!",
      successText:
        "Регистрация успешно завершена. Теперь вы можете перейти в свой дашборд и начать работу с сервисом.", 
      successButton: "Перейти в Дашборд", 
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
      successTitle: "Вітаємо!",
      successText:
        "Реєстрацію успішно завершено. Тепер ви можете перейти до свого дашборду та почати роботу з сервісом.",
      successButton: "Перейти до Дашборду",
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
      successTitle: "Congratulations!",
      successText: "Registration completed successfully. You can now go to your dashboard and start using the service.",
      successButton: "Go to Dashboard",
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

    if (!sessionToken && !error) {
        createSession();
    }
  }, [userId, email, language, sessionToken, error]);

  // 2. Polling статуса - проверяем telegram_verified в профиле
  useEffect(() => {
    if (!userId || !polling) return;

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (cancelled) return;

      try {
        // Проверяем telegram_verified в профиле
        const resp = await fetch(`/api/auth/check-telegram-verified?userId=${userId}`);
        if (!resp.ok) return;

        const data = await resp.json();
        
        if (data.success && data.telegramVerified) {
          // telegram_verified стал true - сразу переходим на шаг 4
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          // Вызываем onVerified с номером телефона из профиля
          onVerified(data.phone || undefined);
          return;
        }
      } catch (e) {
        console.error("[telegram] check-telegram-verified error", e);
      }
    };

    // первый запрос сразу, потом интервал каждые 2 секунды
    poll();
    intervalId = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [userId, polling, onVerified]);

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
    setError(null);
    setPolling(false);
  };


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

          {/* !!! ИСПРАВЛЕНИЕ: Удаляем дублирующий текст-описание (openHint) !!! */}
          {/* <p className="max-w-md text-center text-xs text-zinc-400">
            {texts.openHint}
          </p> */}

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

      {polling && (
        <div className="mt-3 inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-300">
          {texts.waiting}
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
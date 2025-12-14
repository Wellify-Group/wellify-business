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

        // !!! КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: УСЛОВИЕ ЗАВЕРШЕНИЯ - МАКСИМАЛЬНОЕ ДОВЕРИЕ БОТУ !!!
        // Если Bot сказал "completed" (что он делает сразу после записи в БД), переходим.
        const isVerified = normalized.status === "completed"; 

        if (isVerified) {
          setStatus({
            ...normalized,
            status: "completed",
            phoneVerified: true, // Гарантируем TRUE для UI
          });

          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          // Сразу вызываем onVerified с номером телефона
          onVerified(normalized.phone || undefined);
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
    setError(null);
    setPolling(false);
  };


  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {telegramLink && (
        <>
          <div className="relative rounded-[24px] border border-white/8 bg-gradient-to-br from-[#0F172A] to-[#020617] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-sm">
            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50"></div>
            <button
              type="button"
              onClick={handleOpenTelegram}
              className="relative rounded-2xl bg-white p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_20px_70px_rgba(0,0,0,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              <QRCode value={telegramLink} size={200} />
            </button>
          </div>

          <ol className="mt-2 space-y-2.5 text-[12px] leading-relaxed text-slate-400 max-w-sm">
            {texts.steps.map((line, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-semibold text-blue-400">
                  {idx + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {!telegramLink && !error && (
        <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
          <div className="h-2 w-2 rounded-full bg-blue-400"></div>
          <p>
            {loading
              ? "Готовим ссылку для Telegram…"
              : "Подготовка ссылки для Telegram…"}
          </p>
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

      {/* Кнопка "Пропустить" - показывается только если есть telegramLink и статус не completed */}
      {telegramLink && status && status.status !== "completed" && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              // Вызываем onVerified без телефона, чтобы пропустить шаг
              onVerified(undefined);
            }}
            className="text-xs"
          >
            Пропустить, подключу позже
          </Button>
        </div>
      )}
    </div>
  );
}
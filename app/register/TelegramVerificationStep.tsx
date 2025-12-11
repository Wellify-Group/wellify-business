"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface TelegramVerificationStepProps {
  onVerified: () => void;
  language?: "ru" | "uk" | "en";
  userId: string;
  email: string;
}

type SessionStatus = {
  status: "pending" | "completed" | "expired";
  telegramVerified: boolean;
  phone: string | null;
};

const TELEGRAM_API_URL = process.env.NEXT_PUBLIC_TELEGRAM_API_URL;

export function TelegramVerificationStep({
  onVerified,
  language = "ru",
  userId,
  email,
}: TelegramVerificationStepProps) {
  const [loadingLink, setLoadingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);

  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [polling, setPolling] = useState(false);

  // Флаг, чтобы не дергать link-session бесконечно
  const [initialized, setInitialized] = useState(false);

  // 1. Создаем registration_session один раз
  useEffect(() => {
    if (initialized) return; // уже пытались
    if (!TELEGRAM_API_URL) {
      setError("NEXT_PUBLIC_TELEGRAM_API_URL не настроен в .env.local / Vercel");
      setInitialized(true);
      return;
    }

    if (!userId || !email) {
      setError("Не удалось получить данные регистрации. Вернитесь на предыдущий шаг.");
      setInitialized(true);
      return;
    }

    const createSession = async () => {
      try {
        setLoadingLink(true);
        setError(null);

        const resp = await fetch(`${TELEGRAM_API_URL}/telegram/link-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            email,
            language,
          }),
        });

        if (!resp.ok) {
          console.error("link-session failed:", resp.status);
          setError("Не удалось создать сессию Telegram. Попробуйте позже.");
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
        console.error("createSession error:", e);
        setError("Произошла ошибка при создании сессии Telegram.");
      } finally {
        setLoadingLink(false);
        setInitialized(true); // важно!
      }
    };

    createSession();
  }, [initialized, userId, email, language]);

  // 2. Polling статуса сессии
  useEffect(() => {
    if (!TELEGRAM_API_URL) return;
    if (!sessionToken) return;
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const resp = await fetch(
          `${TELEGRAM_API_URL}/telegram/session-status/${sessionToken}`
        );
        if (!resp.ok) {
          console.error("session-status failed:", resp.status);
          return;
        }

        const json = (await resp.json()) as SessionStatus;
        setStatus(json);

        if (json.status === "completed" || json.telegramVerified) {
          setPolling(false);
          clearInterval(interval);
          onVerified();
        }

        if (json.status === "expired") {
          setPolling(false);
          clearInterval(interval);
          setError("Сессия истекла. Нажмите кнопку ниже, чтобы создать новую ссылку.");
        }
      } catch (e) {
        console.error("session-status error:", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionToken, polling, onVerified]);

  // 3. Пересоздать ссылку, если expired
  const handleCreateNewLink = () => {
    setSessionToken(null);
    setTelegramLink(null);
    setStatus(null);
    setError(null);
    setLoadingLink(false);
    setPolling(false);
    setInitialized(false); // позволяем эффекту заново создать сессию
  };

  const texts = {
    ru: { /* как у тебя было */ },
    uk: { /* ... */ },
    en: { /* ... */ },
  }[language];

  // разметку оставляешь как есть
  return (
    <Card className="max-w-xl mx-auto">
      {/* ... остальной JSX без изменений ... */}
    </Card>
  );
}

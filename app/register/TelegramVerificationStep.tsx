// app/register/TelegramVerificationStep.tsx

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

// const TELEGRAM_API_URL = process.env.NEXT_PUBLIC_TELEGRAM_API_URL; // Больше не нужен для прямого обращения

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
    
    if (!userId || !email) {
      setError("Не удалось получить данные регистрации. Вернитесь на предыдущий шаг.");
      setInitialized(true);
      return;
    }

    const createSession = async () => {
      try {
        setLoadingLink(true);
        setError(null);

        // !!! ИЗМЕНЕНИЕ: Обращение к локальному API Route (посреднику) !!!
        const resp = await fetch(`/api/telegram/link-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            email,
            language,
          }),
        });
        // !!! КОНЕЦ ИЗМЕНЕНИЯ !!!

        if (!resp.ok) {
          console.error("link-session failed:", resp.status);
          setError(`Не удалось создать сессию Telegram. Код ошибки: ${resp.status}. Попробуйте позже.`);
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
        // Теперь эта ошибка означает, что ПРОКСИ-МАРШРУТ Next.js не работает
        setError("Произошла внутренняя ошибка при создании сессии Telegram.");
      } finally {
        setLoadingLink(false);
        setInitialized(true); // важно!
      }
    };

    createSession();
  }, [initialized, userId, email, language]);

  // 2. Polling статуса сессии
  useEffect(() => {
    if (!sessionToken) return;
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        // !!! ИЗМЕНЕНИЕ: Обращение к локальному API Route (посреднику) !!!
        const resp = await fetch(
          `/api/telegram/session-status/${sessionToken}`
        );
        // !!! КОНЕЦ ИЗМЕНЕНИЯ !!!
        
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
    ru: {
      title: "Шаг 3. Подтверждение телефона через Telegram",
      description:
        "Откройте нашего бота WELLIFY business в Telegram, отправьте свой номер телефона и дождитесь автоматического завершения регистрации.",
      waiting: "Ждём подтверждения в Telegram...",
      verified: "Телефон подтверждён через Telegram. Завершаем регистрацию...",
      expired: "Ссылка устарела. Создайте новую ссылку и попробуйте ещё раз.",
      buttonOpenTelegram: "Открыть Telegram",
      buttonNewLink: "Создать новую ссылку",
      helpText:
        "1. Отсканируйте QR-код или нажмите кнопку \"Открыть Telegram\".\n2. Нажмите \"Старт\" в боте (если нужно).\n3. Нажмите кнопку \"Отправить номер телефона\".\n4. Вернитесь сюда – шаг завершится автоматически.",
    },
    uk: {
      title: "Крок 3. Підтвердження телефону через Telegram",
      description:
        "Відкрийте наш бот WELLIFY business у Telegram, надішліть свій номер телефону та зачекайте автоматичного завершення реєстрації.",
      waiting: "Чекаємо підтвердження в Telegram...",
      verified: "Телефон підтверджено через Telegram. Завершуємо реєстрацію...",
      expired: "Посилання застаріло. Створіть нове посилання та спробуйте ще раз.",
      buttonOpenTelegram: "Відкрити Telegram",
      buttonNewLink: "Створити нове посилання",
      helpText:
        "1. Відскануйте QR-код або натисніть кнопку \"Відкрити Telegram\".\n2. Натисніть \"Старт\" у боті (якщо потрібно).\n3. Натисніть кнопку \"Надіслати номер телефону\".\n4. Поверніться сюди – крок завершиться автоматично.",
    },
    en: {
      title: "Step 3. Confirm your phone via Telegram",
      description:
        "Open our WELLIFY business bot in Telegram, send your phone number and wait until the registration is completed automatically.",
      waiting: "Waiting for confirmation in Telegram...",
      verified: "Phone confirmed via Telegram. Finishing registration...",
      expired: "Link expired. Create a new link and try again.",
      buttonOpenTelegram: "Open Telegram",
      buttonNewLink: "Create new link",
      helpText:
        "1. Scan the QR code or click \"Open Telegram\".\n2. Press \"Start\" in the bot (if needed).\n3. Press the button to send your phone number.\n4. Come back here – this step will finish automatically.",
    },
  }[language];

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{texts.title}</CardTitle>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!telegramLink && (
          <div className="text-sm text-muted-foreground">
            {loadingLink
              ? "Генерируем ссылку для Telegram..."
              : "Подготовка ссылки для Telegram..."}
          </div>
        )}

        {telegramLink && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-xl">
              <QRCode value={telegramLink} size={180} />
            </div>

            <a
              href={telegramLink}
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Button className="w-full" size="lg">
                {texts.buttonOpenTelegram}
              </Button>
            </a>

            <p className="whitespace-pre-line text-sm text-muted-foreground text-center">
              {texts.helpText}
            </p>
          </div>
        )}

        {status && (
          <div className="text-sm">
            {status.status === "pending" && !status.telegramVerified && (
              <span className="text-yellow-500">{texts.waiting}</span>
            )}

            {(status.status === "completed" || status.telegramVerified) && (
              <span className="text-green-500">{texts.verified}</span>
            )}

            {status.status === "expired" && (
              <span className="text-red-500">{texts.expired}</span>
            )}
          </div>
        )}

        {error && <div className="text-sm text-red-500">{error}</div>}

        {status?.status === "expired" && (
          <Button variant="outline" onClick={handleCreateNewLink}>
            {texts.buttonNewLink}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
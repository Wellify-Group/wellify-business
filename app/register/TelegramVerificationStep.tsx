"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TelegramVerificationStepProps {
  onVerified: () => void;           // что делать, когда Telegram подтверждён (например, перейти в дашборд)
  language?: "ru" | "uk" | "en";    // язык интерфейса (по желанию)
}

type SessionStatus = {
  status: "pending" | "completed" | "expired";
  telegramVerified: boolean;
  phone: string | null;
};

export function TelegramVerificationStep({ onVerified, language = "ru" }: TelegramVerificationStepProps) {
  // Читаем переменную внутри компонента для корректной работы с Next.js
  const TELEGRAM_API_URL = process.env.NEXT_PUBLIC_TELEGRAM_API_URL;
  const [supabase] = useState<SupabaseClient>(() => createBrowserSupabaseClient());

  const [loadingLink, setLoadingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);

  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [polling, setPolling] = useState(false);

  // 1. При первом рендере создаём registration_session через Railway
  useEffect(() => {
    // Отладка: проверяем наличие переменной
    console.log("TELEGRAM_API_URL:", TELEGRAM_API_URL);
    
    if (!TELEGRAM_API_URL) {
      setError("NEXT_PUBLIC_TELEGRAM_API_URL не настроен в .env.local. Убедитесь, что вы перезапустили dev-сервер после добавления переменной.");
      return;
    }

    if (loadingLink || sessionToken) return;

    const createSession = async () => {
      try {
        setLoadingLink(true);
        setError(null);

        // Получаем текущего пользователя из Supabase (auth.users)
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
          console.error("getUser error:", userError);
          setError("Не удалось получить текущего пользователя. Перезагрузите страницу и войдите заново.");
          setLoadingLink(false);
          return;
        }

        const userId = userData.user.id;
        const email = userData.user.email;

        if (!email) {
          setError("У пользователя отсутствует email. Проверьте регистрацию.");
          setLoadingLink(false);
          return;
        }

        // Вызов нашего Railway backend: POST /telegram/link-session
        const apiUrl = `${TELEGRAM_API_URL}/telegram/link-session`;
        console.log("Запрос к Telegram API:", apiUrl);
        
        const resp = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            email,
            language,
          }),
        });

        if (!resp.ok) {
          const errorText = await resp.text().catch(() => "Неизвестная ошибка");
          console.error("link-session failed:", resp.status, errorText);
          setError(`Не удалось создать сессию Telegram (${resp.status}). Проверьте, что бот на Railway работает. Ошибка: ${errorText}`);
          setLoadingLink(false);
          return;
        }

        const json = await resp.json() as { sessionToken: string; telegramLink: string };

        setSessionToken(json.sessionToken);
        setTelegramLink(json.telegramLink);
        setLoadingLink(false);
        setPolling(true);
      } catch (e) {
        console.error("createSession error:", e);
        setError("Произошла ошибка при создании сессии Telegram.");
        setLoadingLink(false);
      }
    };

    createSession();
  }, [supabase, language, loadingLink, sessionToken]);

  // 2. Polling статуса сессии раз в 3 секунды
  useEffect(() => {
    if (!TELEGRAM_API_URL) return;
    if (!sessionToken) return;
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`${TELEGRAM_API_URL}/telegram/session-status/${sessionToken}`);
        if (!resp.ok) {
          console.error("session-status failed:", resp.status);
          return;
        }

        const json = await resp.json() as SessionStatus;
        setStatus(json);

        if (json.status === "completed" || json.telegramVerified) {
          setPolling(false);
          clearInterval(interval);
          onVerified(); // даём знать родителю, что всё ок
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

  // 3. Хэндлер для пересоздания ссылки, если expired
  const handleCreateNewLink = async () => {
    setSessionToken(null);
    setTelegramLink(null);
    setStatus(null);
    setError(null);
    setLoadingLink(false);
    setPolling(false);
  };

  // Тексты в зависимости от языка (минимум)
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

        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        {status?.status === "expired" && (
          <Button variant="outline" onClick={handleCreateNewLink}>
            {texts.buttonNewLink}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
    
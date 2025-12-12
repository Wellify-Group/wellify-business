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
import { AlertCircle, CheckCircle2 } from "lucide-react";

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
  phoneVerified: boolean;
};

export function TelegramVerificationStep({
  onVerified,
  language = "ru",
  userId,
  email,
}: TelegramVerificationStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);

  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [polling, setPolling] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Создаём registration_session один раз
  useEffect(() => {
    if (!userId || !email) {
      setError(
        "Не удалось получить данные регистрации. Вернитесь к предыдущему шагу."
      );
      return;
    }

    const createSession = async () => {
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
            `Не удалось создать сессию Telegram. Код ошибки: ${resp.status}.`
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
        console.error("link-session error", e);
        setError("Произошла внутренняя ошибка при создании сессии Telegram.");
      } finally {
        setLoading(false);
      }
    };

    createSession();
  }, [userId, email, language]);

  // Polling статуса – главное место, где отслеживаем phoneVerified
  useEffect(() => {
    if (!sessionToken) return;
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`/api/telegram/session-status/${sessionToken}`);
        if (!resp.ok) {
          console.error("session-status failed:", resp.status);
          return;
        }

        const json = (await resp.json()) as SessionStatus;
        setStatus(json);

        // КРИТИЧНО: как только phoneVerified === true – считаем шаг завершён
        if (json.phoneVerified) {
          setIsVerified(true);
          setPolling(false);
          clearInterval(interval);
        }

        if (json.status === "expired") {
          setPolling(false);
          clearInterval(interval);
          setError(
            "Ссылка истекла. Нажмите «Создать новую ссылку», чтобы начать заново."
          );
        }
      } catch (e) {
        console.error("session-status error", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionToken, polling]);

  const handleCreateNewLink = () => {
    // Принудительный ресет шага
    setSessionToken(null);
    setTelegramLink(null);
    setStatus(null);
    setError(null);
    setIsVerified(false);
    setPolling(false);

    // Триггернём useEffect ещё раз через смену userId/email мы не можем,
    // поэтому просто перезагрузим страницу – шаг 3 всё равно отдельный этап.
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const texts = {
    ru: {
      title: "Шаг 3. Подтверждение телефона через Telegram",
      description:
        "Откройте бота WELLIFY business, отправьте свой номер телефона и завершите регистрацию.",
      waiting: "Ждём подтверждения телефона в Telegram…",
      verifiedTitle: "Телефон подтверждён",
      verifiedText:
        "Номер телефона директора успешно подтверждён. Можно переходить к работе в системе.",
      openBot: "Открыть бота в Telegram",
      newLink: "Создать новую ссылку",
      goDashboard: "Перейти в дашборд",
    },
    uk: {
      title: "Крок 3. Підтвердження телефону через Telegram",
      description:
        "Відкрийте бота WELLIFY business, надішліть свій номер телефону та завершіть реєстрацію.",
      waiting: "Чекаємо підтвердження телефону в Telegram…",
      verifiedTitle: "Телефон підтверджено",
      verifiedText:
        "Номер телефону директора успішно підтверджено. Можна переходити до роботи в системі.",
      openBot: "Відкрити бота в Telegram",
      newLink: "Створити нове посилання",
      goDashboard: "Перейти до дашборду",
    },
    en: {
      title: "Step 3. Confirm phone via Telegram",
      description:
        "Open the WELLIFY business bot, send your phone number and finish the registration.",
      waiting: "Waiting for phone confirmation in Telegram…",
      verifiedTitle: "Phone confirmed",
      verifiedText:
        "Director’s phone number has been confirmed. You can go to the dashboard.",
      openBot: "Open bot in Telegram",
      newLink: "Create new link",
      goDashboard: "Go to dashboard",
    },
  }[language];

  // Состояние "всё подтверждено" – отдельный компактный экран
  if (isVerified) {
    return (
      <Card className="border border-emerald-500/30 bg-[rgba(3,84,63,0.15)]">
        <CardHeader className="text-center space-y-3">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
          <CardTitle className="text-xl text-emerald-50">
            {texts.verifiedTitle}
          </CardTitle>
          <CardDescription className="text-sm text-emerald-200">
            {texts.verifiedText}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 pb-7">
          <Button
            size="lg"
            className="w-full max-w-xs rounded-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
            onClick={onVerified}
          >
            {texts.goDashboard}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Обычное состояние шага
  return (
    <Card className="border border-zinc-800/80 bg-zinc-950/80">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-lg font-semibold text-zinc-50">
          {texts.title}
        </CardTitle>
        <CardDescription className="text-sm text-zinc-400">
          {texts.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pb-6">
        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-700/70 bg-rose-950/80 px-3 py-2 text-xs text-rose-100">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {telegramLink && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/90 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.7)]">
              <QRCode value={telegramLink} size={190} />
            </div>

            <Button
              type="button"
              className="w-full max-w-xs rounded-full bg-[var(--accent-primary,#2563eb)] text-sm font-semibold text-white shadow-[0_18px_60px_rgba(37,99,235,0.6)] hover:bg-[var(--accent-primary-hover,#1d4ed8)]"
              onClick={() =>
                window.open(telegramLink, "_blank", "noopener,noreferrer")
              }
            >
              {texts.openBot}
            </Button>

            <p className="text-[11px] leading-relaxed text-zinc-500 text-center max-w-sm">
              1. Отсканируйте QR-код или нажмите кнопку выше. <br />
              2. Нажмите «Старт» в боте (если нужно). <br />
              3. Нажмите «Отправить номер телефона». <br />
              4. Вернитесь сюда – шаг завершится автоматически.
            </p>
          </div>
        )}

        {!telegramLink && !error && (
          <p className="text-center text-xs text-zinc-500">
            {loading
              ? "Готовим ссылку для Telegram..."
              : "Ожидаем создание ссылки для Telegram..."}
          </p>
        )}

        {status?.status === "pending" && !status.phoneVerified && (
          <div className="mt-2 w-full rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-300">
            {texts.waiting}
          </div>
        )}

        {status?.status === "expired" && (
          <div className="space-y-3">
            <div className="w-full rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-center text-xs font-medium text-rose-200">
              Ссылка устарела. Создайте новую и повторите попытку.
            </div>
            <Button
              variant="outline"
              className="w-full max-w-xs rounded-full border-zinc-700/80 bg-zinc-900/80 text-xs"
              onClick={handleCreateNewLink}
            >
              {texts.newLink}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

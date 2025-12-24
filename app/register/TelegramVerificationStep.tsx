"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
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

// TELEGRAM_API_URL is server-only, use API routes instead
// This component should use /api/telegram/create-session and /api/telegram/session-status endpoints
// По INTERNAL_RULES.md: используется /api/telegram/create-session

export function TelegramVerificationStep({
  onVerified,
  language = "ru",
  userId,
  email,
}: TelegramVerificationStepProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  // 1. Создаём Telegram-сессию
  useEffect(() => {
    const createSession = async () => {
      if (!userId || !email) {
        setError(
          t<string>("register_error_telegram_data_missing")
        );
        return;
      }

      // Use API route instead of direct TELEGRAM_API_URL access

      try {
        setLoading(true);
        setError(null);

        // По INTERNAL_RULES.md: используется /api/telegram/create-session
        console.log("[telegram] Creating session with:", { userId, email, language });
        
        const resp = await fetch("/api/telegram/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, email, language }),
        });

        console.log("[telegram] Response status:", resp.status);
        console.log("[telegram] Response ok:", resp.ok);
        console.log("[telegram] Response headers:", Object.fromEntries(resp.headers.entries()));

        const responseData = await resp.json();
        console.log("[telegram] Response data:", responseData);

        if (!resp.ok) {
          const errorMessage = responseData?.error || responseData?.details || `HTTP ${resp.status}: ${resp.statusText}`;
          console.error("[telegram] Error creating session:", {
            status: resp.status,
            statusText: resp.statusText,
            error: errorMessage,
            fullResponse: responseData
          });
          setError(
            errorMessage || t<string>("register_error_internal")
          );
          return;
        }

        const json = responseData as {
          sessionToken: string;
          telegramLink: string;
        };

        if (!json.sessionToken || !json.telegramLink) {
          console.error("[telegram] Invalid response format:", json);
          setError("Неверный формат ответа от сервера. Попробуйте еще раз.");
          return;
        }

        console.log("[telegram] Session created successfully:", {
          sessionToken: json.sessionToken.substring(0, 20) + "...",
          telegramLink: json.telegramLink
        });

        setSessionToken(json.sessionToken);
        setTelegramLink(json.telegramLink);
        setPolling(true);
      } catch (e: any) {
        console.error("[telegram] create-session error:", e);
        console.error("[telegram] Error details:", {
          message: e?.message,
          stack: e?.stack,
          name: e?.name
        });
        const errorMessage = e?.message || "Неизвестная ошибка при создании сессии Telegram";
        setError(errorMessage);
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
    <div className="flex flex-col items-center gap-4 py-2">
      {telegramLink && (
        <>
          <div className="w-full space-y-4 text-center">
            <p className="text-sm text-zinc-400 leading-relaxed px-4">
              {t<string>("register_telegram_instruction")}
            </p>
          </div>
          <div className="relative rounded-[24px] border border-border bg-card p-5 shadow-[var(--shadow-modal)] backdrop-blur-sm">
            <div className="absolute inset-0 rounded-[24px] bg-primary/5 opacity-50"></div>
            <button
              type="button"
              onClick={handleOpenTelegram}
              className="relative rounded-2xl bg-card border border-border p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[var(--shadow-floating)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              <QRCode value={telegramLink} size={200} />
            </button>
          </div>

        </>
      )}

      {!telegramLink && !error && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
          <div className="h-2 w-2 rounded-full bg-primary"></div>
          <p>
            {loading
              ? t<string>("register_telegram_preparing")
              : t<string>("register_telegram_preparing")}
          </p>
        </div>
      )}


      {status && status.status === "expired" && (
        <div className="mt-3 flex flex-col items-center gap-2 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/10 px-3 py-1.5 text-[11px] text-[color:var(--color-warning)]">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{t<string>("register_telegram_session_expired")}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCreateNewLink}
          >
            {t<string>("register_telegram_new_link")}
          </Button>
        </div>
      )}


      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

    </div>
  );
}
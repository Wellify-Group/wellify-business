/**
 * Send SMS verification code (без Twilio)
 * 
 * This endpoint:
 * - Validates phone number format
 * - Checks rate limits (via database phone_verification_attempts table)
 * - Generates and saves verification code
 * - Updates attempt tracking in database
 * 
 * Rate limits:
 * - Max 1 SMS per 60 seconds per phone number
 * - Max 5 SMS per 24 hours per phone number per action
 * 
 * NOTE: SMS отправка будет реализована через внешний сервис на Render
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Нормализация номера телефона в формат E.164
function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

// Валидация формата E.164
function validatePhoneFormat(phone: string): boolean {
  // E.164: начинается с +, затем 1-15 цифр
  return /^\+\d{8,15}$/.test(phone);
}

// Генерация 6-значного кода
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Backend API URL
const API_URL = process.env.RENDER_API_URL || process.env.NEXT_PUBLIC_API_URL || '';

if (!API_URL) {
  console.warn('RENDER_API_URL is not set. Phone verification will fail.');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body?.phone as string | undefined;
    const action = (body?.action as string | undefined) || "signup";

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone is required" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    // Валидация формата
    if (!validatePhoneFormat(normalizedPhone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone must be in international E.164 format (+380...)",
        },
        { status: 400 }
      );
    }

    // Валидация action
    if (!["signup", "password_reset", "phone_update"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Проверяем лимиты через таблицу phone_verification_attempts
    let attemptRecord: any = null;
    try {
      const { data, error: fetchError } = await supabaseAdmin
        .from("phone_verification_attempts")
        .select("*")
        .eq("phone", normalizedPhone)
        .eq("action", action)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.warn("[phone-send-code] Rate limit check failed, allowing SMS", fetchError);
      } else {
        attemptRecord = data;
      }
    } catch (rateLimitError: any) {
      console.warn("[phone-send-code] Rate limit check exception, allowing SMS", rateLimitError);
      attemptRecord = null;
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Проверяем лимиты только если удалось получить запись
    if (attemptRecord) {
      try {
        // Проверка: максимум 1 SMS каждые 60 секунд
        const lastSent = new Date(attemptRecord.last_sent_at);
        if (lastSent > oneMinuteAgo) {
          const secondsLeft = Math.ceil((lastSent.getTime() - oneMinuteAgo.getTime()) / 1000);
          return NextResponse.json(
            {
              success: false,
              error: `Слишком часто. Попробуйте через ${secondsLeft} секунд.`,
            },
            { status: 429 }
          );
        }

        // Проверка: максимум 5 SMS за 24 часа
        if (attemptRecord.attempts_count >= 5) {
          const lastSentDate = new Date(attemptRecord.last_sent_at);
          if (lastSentDate > oneDayAgo) {
            return NextResponse.json(
              {
                success: false,
                error: "Превышен лимит попыток на сегодня. Попробуйте завтра.",
              },
              { status: 429 }
            );
          } else {
            // Сбрасываем счётчик, если прошли сутки
            try {
              await supabaseAdmin
                .from("phone_verification_attempts")
                .update({ attempts_count: 0 })
                .eq("phone", normalizedPhone)
                .eq("action", action);
            } catch (resetError) {
              console.warn("[phone-send-code] Failed to reset attempt counter", resetError);
            }
          }
        }
      } catch (limitCheckError) {
        console.warn("[phone-send-code] Error checking limits, allowing SMS", limitCheckError);
      }
    }

    // Генерируем код
    const code = generateVerificationCode();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 минут

    // Сохраняем код в БД (создадим таблицу phone_verification_codes)
    try {
      // Пока используем существующую структуру через Supabase
      // TODO: Заменить на PostgreSQL API после миграции
      
      // Сохраняем код (временно в profiles или создадим отдельную таблицу)
      // Для простоты пока используем phone_verification_attempts для хранения кода
      const newAttemptCount = attemptRecord
        ? attemptRecord.attempts_count + 1
        : 1;

      await supabaseAdmin.from("phone_verification_attempts").upsert(
        {
          phone: normalizedPhone,
          action: action,
          attempts_count: newAttemptCount,
          last_sent_at: now.toISOString(),
          verification_code: code, // Временно храним код здесь
          code_expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: "phone,action",
        }
      );

      // Отправляем SMS через внешний API (Render backend)
      const renderApiUrl = process.env.RENDER_API_URL || process.env.TELEGRAM_API_URL;
      if (renderApiUrl) {
        try {
          const smsResponse = await fetch(`${renderApiUrl}/api/sms/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: normalizedPhone,
              code: code,
            }),
          });

          if (!smsResponse.ok) {
            console.error("[phone-send-code] Failed to send SMS via Render API", await smsResponse.text());
          }
        } catch (smsError) {
          console.error("[phone-send-code] Error calling SMS API", smsError);
          // Не блокируем ответ, код уже сохранён
        }
      } else {
        console.warn("[phone-send-code] RENDER_API_URL not configured, SMS not sent");
      }

      console.log("[phone-send-code] Verification code generated and saved", {
        phone: normalizedPhone,
        action,
        code: code.substring(0, 2) + "****", // Логируем частично
      });

      return NextResponse.json({
        success: true,
        message: "Код отправлен, проверьте СМС",
      });
    } catch (error: any) {
      console.error("[phone-send-code] Error saving code", error);

      return NextResponse.json(
        {
          success: false,
          error: "Не удалось отправить код. Попробуйте позже.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[phone-send-code] Unexpected error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

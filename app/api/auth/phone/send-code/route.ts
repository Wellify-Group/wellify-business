/**
 * Send SMS verification code via Twilio
 * 
 * This endpoint:
 * - Validates phone number format
 * - Checks rate limits (via Supabase phone_verification_attempts table)
 * - Sends SMS via Twilio Verify
 * - Updates attempt tracking in Supabase
 * 
 * Rate limits:
 * - Max 1 SMS per 60 seconds per phone number
 * - Max 5 SMS per 24 hours per phone number per action
 */

import { NextRequest, NextResponse } from "next/server";
import { getTwilioClient, getVerifyServiceSid } from "@/lib/twilio";
import { createClient } from "@supabase/supabase-js";

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

    // Создаём admin-клиент Supabase для проверки лимитов
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[phone-send-code] Missing Supabase envs");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    // Проверяем лимиты через таблицу phone_verification_attempts
    // ОБЕРНУТО В TRY-CATCH: если проверка лимитов падает, разрешаем отправку
    let attemptRecord: any = null;
    try {
      const { data, error: fetchError } = await supabaseAdmin
        .from("phone_verification_attempts")
        .select("*")
        .eq("phone", normalizedPhone)
        .eq("action", action)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 = no rows returned (это нормально для первой попытки)
        // Другие ошибки логируем, но не блокируем отправку
        console.warn("[phone-send-code] Rate limit check failed, allowing SMS", fetchError);
      } else {
        attemptRecord = data;
      }
    } catch (rateLimitError: any) {
      // Если проверка лимитов полностью падает (таблица не существует, RLS, и т.д.)
      // Логируем ошибку, но разрешаем отправку SMS
      console.warn("[phone-send-code] Rate limit check exception, allowing SMS", rateLimitError);
      attemptRecord = null; // Продолжаем без проверки лимитов
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
              // Не блокируем отправку, если не удалось сбросить счётчик
            }
          }
        }
      } catch (limitCheckError) {
        console.warn("[phone-send-code] Error checking limits, allowing SMS", limitCheckError);
        // Продолжаем отправку, если проверка лимитов упала
      }
    }

    // Получаем Twilio клиент
    const client = getTwilioClient();
    if (!client) {
      return NextResponse.json(
        { success: false, error: "Server config error (Twilio)" },
        { status: 500 }
      );
    }

    const verifyServiceSid = getVerifyServiceSid();
    if (!verifyServiceSid) {
      return NextResponse.json(
        {
          success: false,
          error: "Server config error (Twilio Verify Service)",
        },
        { status: 500 }
      );
    }

    // Отправляем SMS через Twilio Verify
    try {
      const verification = await client.verify.v2
        .services(verifyServiceSid)
        .verifications.create({
          to: normalizedPhone,
          channel: "sms",
        });

      // Обновляем/создаём запись в phone_verification_attempts
      // ОБЕРНУТО В TRY-CATCH: если обновление не удалось, SMS уже отправлено, просто логируем
      try {
        const newAttemptCount = attemptRecord
          ? attemptRecord.attempts_count + 1
          : 1;

        await supabaseAdmin.from("phone_verification_attempts").upsert(
          {
            phone: normalizedPhone,
            action: action,
            attempts_count: newAttemptCount,
            last_sent_at: now.toISOString(),
          },
          {
            onConflict: "phone,action",
          }
        );
      } catch (updateError) {
        console.warn("[phone-send-code] Failed to update attempt record", updateError);
        // SMS уже отправлено, не блокируем успешный ответ
      }

      console.log("[phone-send-code] SMS sent", {
        phone: normalizedPhone,
        action,
        sid: verification.sid,
      });

      return NextResponse.json({
        success: true,
        sid: verification.sid,
        message: "Код отправлен, проверьте СМС",
      });
    } catch (twilioError: any) {
      console.error("[phone-send-code] Twilio error", twilioError);

      // Обработка специфичных ошибок Twilio
      if (twilioError.code === 60200 || twilioError.code === 60203) {
        // Неверный номер телефона
        return NextResponse.json(
          {
            success: false,
            error: "Неверный номер телефона. Проверьте формат.",
          },
          { status: 400 }
        );
      }

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


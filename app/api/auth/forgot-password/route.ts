/**
 * Send password reset email via Supabase
 * 
 * This endpoint:
 * - Validates email format
 * - Checks rate limits (via Supabase email_reset_attempts table)
 * - Sends password reset email via Supabase
 * - Updates attempt tracking in Supabase
 * 
 * Rate limits:
 * - Max 1 email per 60 seconds per email address
 * - Max 5 emails per 24 hours per email address
 * 
 * IMPORTANT: We use Supabase for email, NOT Twilio!
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body?.email as string | undefined)?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Создаём admin-клиент Supabase для проверки лимитов и отправки письма
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[forgot-password] Missing Supabase envs");
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

    // Проверяем лимиты через таблицу email_reset_attempts
    // ОБЕРНУТО В TRY-CATCH: если проверка лимитов падает, разрешаем отправку
    let attemptRecord: any = null;
    try {
      const { data, error: fetchError } = await supabaseAdmin
        .from("email_reset_attempts")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 = no rows returned (это нормально для первой попытки)
        // Другие ошибки логируем, но не блокируем отправку
        console.warn("[forgot-password] Rate limit check failed, allowing email", fetchError);
      } else {
        attemptRecord = data;
      }
    } catch (rateLimitError: any) {
      // Если проверка лимитов полностью падает (таблица не существует, RLS, и т.д.)
      // Логируем ошибку, но разрешаем отправку email
      console.warn("[forgot-password] Rate limit check exception, allowing email", rateLimitError);
      attemptRecord = null; // Продолжаем без проверки лимитов
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Проверяем лимиты только если удалось получить запись
    if (attemptRecord) {
      try {
        // Проверка: максимум 1 email каждые 60 секунд
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

        // Проверка: максимум 5 emails за 24 часа
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
                .from("email_reset_attempts")
                .update({ attempts_count: 0 })
                .eq("email", email);
            } catch (resetError) {
              console.warn("[forgot-password] Failed to reset attempt counter", resetError);
              // Не блокируем отправку, если не удалось сбросить счётчик
            }
          }
        }
      } catch (limitCheckError) {
        console.warn("[forgot-password] Error checking limits, allowing email", limitCheckError);
        // Продолжаем отправку, если проверка лимитов упала
      }
    }

    // Отправляем письмо через Supabase
    // Используем обычный клиент для resetPasswordForEmail (он отправляет письмо автоматически)
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[forgot-password] Missing Supabase public envs");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dev.wellifyglobal.com";
    const redirectTo = `${siteUrl}/auth/reset-password`;

    try {
      // resetPasswordForEmail автоматически отправляет письмо
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (resetError) {
        console.error("[forgot-password] Supabase error", resetError);
        
        // Не раскрываем, существует ли пользователь с таким email
        // Всегда возвращаем успех для безопасности
        return NextResponse.json({
          success: true,
          message: "Если email зарегистрирован, на него отправлено письмо для сброса пароля.",
        });
      }

      // Обновляем/создаём запись в email_reset_attempts
      // ОБЕРНУТО В TRY-CATCH: если обновление не удалось, email уже отправлен, просто логируем
      try {
        const newAttemptCount = attemptRecord ? attemptRecord.attempts_count + 1 : 1;

        await supabaseAdmin.from("email_reset_attempts").upsert(
          {
            email: email,
            attempts_count: newAttemptCount,
            last_sent_at: now.toISOString(),
          },
          {
            onConflict: "email",
          }
        );
      } catch (updateError) {
        console.warn("[forgot-password] Failed to update attempt record", updateError);
        // Email уже отправлен, не блокируем успешный ответ
      }

      console.log("[forgot-password] Reset email sent", { email });

      return NextResponse.json({
        success: true,
        message: "Если email зарегистрирован, на него отправлено письмо для сброса пароля.",
      });
    } catch (error: any) {
      console.error("[forgot-password] Unexpected error", error);
      
      // Всегда возвращаем успех для безопасности (не раскрываем существование email)
      return NextResponse.json({
        success: true,
        message: "Если email зарегистрирован, на него отправлено письмо для сброса пароля.",
      });
    }
  } catch (error: any) {
    console.error("[forgot-password] Unexpected error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}


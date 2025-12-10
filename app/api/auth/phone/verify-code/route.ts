/**
 * Verify SMS code via Twilio
 * 
 * This endpoint:
 * - Validates phone number and code format
 * - Verifies code via Twilio Verify
 * - Returns success/failure status
 * 
 * Note: This does NOT send any SMS, only verifies the code.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTwilioClient, getVerifyServiceSid } from "@/lib/twilio";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Нормализация номера телефона в формат E.164
function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

export async function POST(req: NextRequest) {
  try {
    // Читаем body один раз и сохраняем в переменную
    const body = await req.json();
    const { phone, code, email } = body;

    // Простейшая проверка входных данных
    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: "phone and code are required" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    const trimmedCode = code.trim();

    // Валидация кода: только цифры, длина 4-8 символов
    if (!/^\d{4,8}$/.test(trimmedCode)) {
      return NextResponse.json(
        { success: false, error: "Code must be 4-8 digits" },
        { status: 400 }
      );
    }

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

    // Проверяем код через Twilio Verify
    const check = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: normalizedPhone,
        code: trimmedCode,
      });

    // Twilio вернул статус проверки
    console.log("[phone-verify-code] Verification check", {
      phone: normalizedPhone,
      status: check.status,
    });

    if (check.status === "approved") {
      // КРИТИЧНО: Код правильный - телефон подтверждён через Twilio (check.status === "approved")
      // Теперь нужно записать номер телефона и phone_verified = TRUE в БД
      // Принцип аналогичен шагу 2: записываем напрямую в profiles через admin клиент
      
      try {
        const supabaseAdmin = createAdminSupabaseClient();
        let userId: string | null = null;

        // Пытаемся получить пользователя из сессии
        try {
          const supabase = await createServerSupabaseClient();
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (user && !userError) {
            userId = user.id;
            console.log("[phone-verify-code] User authenticated from session", { userId });
          }
        } catch (sessionError) {
          console.log("[phone-verify-code] Could not get user from session", sessionError);
        }

        // Если пользователь не залогинен, ищем по email из body (если передан)
        if (!userId && email) {
            console.log("[phone-verify-code] User not authenticated, searching by email", { email });
            
            const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            
            if (!listError && usersList?.users) {
              const foundUser = usersList.users.find(
                (u) => u.email && u.email.toLowerCase().trim() === email.toLowerCase().trim()
              );
              
              if (foundUser) {
                userId = foundUser.id;
                console.log("[phone-verify-code] User found by email", { userId, email });
              }
            }
          }
        }

        // Если всё ещё нет userId, ищем по телефону в profiles (fallback)
        if (!userId) {
          console.log("[phone-verify-code] No userId, searching by phone in profiles");
          const { data: profileByPhone, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("phone", normalizedPhone)
            .maybeSingle();

          if (profileByPhone && !profileError) {
            userId = profileByPhone.id;
            console.log("[phone-verify-code] User found by phone in profiles", { userId });
          }
        }

        if (!userId) {
          console.error("[phone-verify-code] Could not find user ID", {
            phone: normalizedPhone,
            hasSession: false,
          });
          // Не блокируем ответ, так как Twilio верификация прошла успешно
          // Polling найдёт пользователя позже
          return NextResponse.json({
            success: true,
            status: "approved",
            message: "Phone verified via Twilio, but user not found in database",
          });
        }

        // КРИТИЧНО: Записываем номер телефона и phone_verified = TRUE в profiles
        // Используем UPSERT для надёжности (создаст запись, если её нет, или обновит существующую)
        const { error: upsertError } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              id: userId,
              phone: normalizedPhone,
              phone_verified: true,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "id",
            }
          );

        if (upsertError) {
          console.error("[phone-verify-code] Failed to upsert phone_verified in profiles", {
            error: upsertError,
            userId,
            phone: normalizedPhone,
          });
          
          // Fallback: пытаемся через RPC функцию
          const { error: rpcError } = await supabaseAdmin.rpc(
            "verify_phone_and_update_profile",
            {
              p_user_id: userId,
              p_phone: normalizedPhone,
            }
          );

          if (rpcError) {
            console.error("[phone-verify-code] RPC verify_phone_and_update_profile also failed", rpcError);
            // Не блокируем ответ, так как Twilio верификация прошла успешно
            return NextResponse.json({
              success: true,
              status: "approved",
              message: "Phone verified via Twilio, but database update failed",
            });
          } else {
            console.log("[phone-verify-code] RPC verify_phone_and_update_profile success (fallback)", {
              userId,
              phone: normalizedPhone,
            });
          }
        } else {
          console.log("[phone-verify-code] ✅ Phone verified and profile updated successfully", {
            userId,
            phone: normalizedPhone,
            phone_verified: true,
          });
        }

        return NextResponse.json({
          success: true,
          status: "approved",
          message: "Phone verified and profile updated",
        });
      } catch (dbError) {
        console.error("[phone-verify-code] Error updating phone_verified", dbError);
        // Не блокируем ответ, так как Twilio верификация прошла успешно
        return NextResponse.json({
          success: true,
          status: "approved",
          message: "Phone verified via Twilio, but profile update error occurred",
        });
      }
    }

    // Код неправильный / истёк / слишком много попыток и т.п.
    return NextResponse.json(
      {
        success: false,
        status: check.status,
        error: "Неверный код или код истёк. Попробуйте ещё раз.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[phone-verify-code] Twilio check error", error);

    return NextResponse.json(
      {
        success: false,
        error: "Не удалось проверить код. Попробуйте ещё раз.",
      },
      { status: 500 }
    );
  }
}


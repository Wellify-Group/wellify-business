/**
 * Verify SMS code (без Twilio)
 * 
 * This endpoint:
 * - Validates phone number and code format
 * - Verifies code from database
 * - Returns success/failure status
 * 
 * Note: This does NOT send any SMS, only verifies the code.
 */

import { NextRequest, NextResponse } from "next/server";
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

    const supabaseAdmin = createAdminSupabaseClient();

    // Проверяем код из БД
    try {
      // Получаем запись с кодом из phone_verification_attempts
      const { data: attemptRecord, error: fetchError } = await supabaseAdmin
        .from("phone_verification_attempts")
        .select("*")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (fetchError || !attemptRecord) {
        return NextResponse.json(
          {
            success: false,
            error: "Код не найден или истёк. Запросите новый код.",
          },
          { status: 400 }
        );
      }

      // Проверяем код
      const storedCode = attemptRecord.verification_code;
      const codeExpiresAt = attemptRecord.code_expires_at
        ? new Date(attemptRecord.code_expires_at)
        : null;

      if (!storedCode || storedCode !== trimmedCode) {
        return NextResponse.json(
          {
            success: false,
            error: "Неверный код. Попробуйте ещё раз.",
          },
          { status: 400 }
        );
      }

      // Проверяем срок действия
      if (codeExpiresAt && codeExpiresAt < new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: "Код истёк. Запросите новый код.",
          },
          { status: 400 }
        );
      }

      // Код правильный - телефон подтверждён
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
        // Не блокируем ответ, так как код правильный
        return NextResponse.json({
          success: true,
          status: "approved",
          message: "Phone verified, but user not found in database",
        });
      }

      // Записываем номер телефона и phone_verified = TRUE в profiles
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
          return NextResponse.json({
            success: true,
            status: "approved",
            message: "Phone verified, but database update failed",
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

      // Удаляем использованный код
      await supabaseAdmin
        .from("phone_verification_attempts")
        .delete()
        .eq("phone", normalizedPhone)
        .eq("action", attemptRecord.action);

      return NextResponse.json({
        success: true,
        status: "approved",
        message: "Phone verified and profile updated",
      });
    } catch (dbError) {
      console.error("[phone-verify-code] Error verifying code", dbError);
      return NextResponse.json(
        {
          success: false,
          error: "Не удалось проверить код. Попробуйте ещё раз.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[phone-verify-code] Unexpected error", error);

    return NextResponse.json(
      {
        success: false,
        error: "Не удалось проверить код. Попробуйте ещё раз.",
      },
      { status: 500 }
    );
  }
}

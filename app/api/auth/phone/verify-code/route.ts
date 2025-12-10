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
    const { phone, code } = await req.json();

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
      // Код правильный - телефон подтверждён через Twilio
      // Обновляем профиль пользователя в Supabase
      try {
        // Сначала пробуем получить текущего пользователя через серверный клиент
        let userId: string | null = null;
        let supabase = await createServerSupabaseClient();
        
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (user && !userError) {
          // Пользователь залогинен - используем его ID
          userId = user.id;
        } else {
          // Пользователь не залогинен (возможно, во время регистрации)
          // Используем admin-клиент для поиска пользователя по телефону
          console.log("[phone-verify-code] User not authenticated, searching by phone via admin client");
          const supabaseAdmin = createAdminSupabaseClient();
          
          const { data: usersPage, error: listError } =
            await supabaseAdmin.auth.admin.listUsers({
              page: 1,
              perPage: 1000,
            });

          if (!listError && usersPage?.users) {
            // Сначала ищем по телефону в auth.users
            let foundUser = usersPage.users.find(
              (u) => u.phone && u.phone.trim() === normalizedPhone
            );

            // Если не нашли по телефону, пробуем найти в profiles по phone и взять userId
            if (!foundUser) {
              const { data: profile, error: profileError } = await supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("phone", normalizedPhone)
                .maybeSingle();

              if (!profileError && profile) {
                // Нашли профиль по телефону, теперь найдём пользователя по id
                foundUser = usersPage.users.find((u) => u.id === profile.id);
              }
            }

            if (foundUser) {
              userId = foundUser.id;
              // Используем admin-клиент для обновления
              supabase = supabaseAdmin as any;
            }
          }
        }

        if (!userId) {
          console.warn("[phone-verify-code] User not found for phone", normalizedPhone);
          // Не блокируем ответ, так как Twilio верификация прошла успешно
          return NextResponse.json({ 
            success: true, 
            status: "approved",
            message: "Phone verified, but user profile not found" 
          });
        }

        // Обновляем профиль через upsert (создаёт, если не существует)
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              phone: normalizedPhone,
              phone_verified: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );

        if (profileError) {
          console.error("[phone-verify-code] Failed to update profile phone verification", profileError);
          // Не блокируем ответ, так как Twilio верификация прошла успешно
          // Но логируем ошибку для отладки
          return NextResponse.json({
            success: true,
            status: "approved",
            message: "Phone verified, but profile update failed",
            warning: profileError.message,
          });
        }

        console.log("[phone-verify-code] Phone verified and profile updated", {
          userId,
          phone: normalizedPhone,
        });

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
          message: "Phone verified, but profile update error occurred",
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


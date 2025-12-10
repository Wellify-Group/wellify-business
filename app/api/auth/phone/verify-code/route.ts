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
      // Обновляем phone_verified в profiles для пользователя с этим телефоном
      try {
        const supabaseAdmin = createAdminSupabaseClient();
        
        // Ищем пользователя по телефону в auth.users
        const { data: usersPage, error: listError } =
          await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });

        if (!listError && usersPage?.users) {
          const user = usersPage.users.find(
            (u) => u.phone && u.phone.trim() === normalizedPhone
          );

          if (user) {
            // Обновляем phone_verified в profiles
            const { error: updateError } = await supabaseAdmin
              .from("profiles")
              .update({
                phone_verified: true,
                phone: normalizedPhone,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            if (updateError) {
              console.error("[phone-verify-code] Failed to update phone_verified in profiles", updateError);
              // Не блокируем ответ, так как Twilio верификация прошла успешно
            } else {
              console.log("[phone-verify-code] phone_verified updated in profiles", {
                userId: user.id,
                phone: normalizedPhone,
              });
            }
          } else {
            console.warn("[phone-verify-code] User not found for phone", normalizedPhone);
          }
        }
      } catch (dbError) {
        console.error("[phone-verify-code] Error updating phone_verified", dbError);
        // Не блокируем ответ, так как Twilio верификация прошла успешно
      }

      return NextResponse.json({ success: true, status: "approved" });
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


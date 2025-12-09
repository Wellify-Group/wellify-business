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
      // Код правильный - телефон подтверждён
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


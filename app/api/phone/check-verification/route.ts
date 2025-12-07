import { NextRequest, NextResponse } from "next/server";
import { twilioClient, verifyServiceSid } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code } = body;

    // Валидация входных данных
    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone and code are required" },
        { status: 400 }
      );
    }

    if (typeof phone !== "string" || typeof code !== "string") {
      return NextResponse.json(
        { error: "Phone and code must be strings" },
        { status: 400 }
      );
    }

    // Проверка кода через Twilio Verify
    const result = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phone,
        code,
      });

    // Возвращаем результат: valid = true только если status === "approved"
    const valid = result.status === "approved";

    return NextResponse.json({ valid }, { status: 200 });
  } catch (error: any) {
    console.error("Twilio check verification error:", error);

    // Обработка ошибок Twilio
    if (error.status === 404 || error.code === 20404) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 400 }
      );
    }

    if (error.status === 400 || error.code === 60200) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Внутренняя ошибка сервера
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}

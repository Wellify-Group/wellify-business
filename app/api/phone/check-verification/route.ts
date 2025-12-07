import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const apiKey = process.env.TWILIO_API_KEY!;
const apiSecret = process.env.TWILIO_API_SECRET!;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

const client = twilio(apiKey, apiSecret, { accountSid });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code } = body;

    // Проверка наличия phone и code
    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone and code are required" },
        { status: 400 }
      );
    }

    // Проверка кода через Twilio Verify
    const result = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phone,
        code,
      });

    // Возвращаем результат проверки
    if (result.status === "approved") {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false });
  } catch (err) {
    console.error("Twilio check error", err);
    return NextResponse.json(
      { error: "Failed to check verification code" },
      { status: 500 }
    );
  }
}

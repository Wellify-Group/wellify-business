import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const apiKey = process.env.TWILIO_API_KEY!;
const apiSecret = process.env.TWILIO_API_SECRET!;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

const client = twilio(apiKey, apiSecret, { accountSid });

// Валидация формата E.164: + и от 8 до 15 цифр, первая цифра после + не 0
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, locale } = body;

    // Валидация формата E.164
    if (!phone || typeof phone !== "string" || !E164_REGEX.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone" },
        { status: 400 }
      );
    }

    // Маппинг локали: "ru" → "ru", "uk" → "uk", остальное → "en"
    let twilioLocale: string;
    if (locale === "ru") {
      twilioLocale = "ru";
    } else if (locale === "uk") {
      twilioLocale = "uk";
    } else {
      twilioLocale = "en";
    }

    // Отправка кода через Twilio Verify
    await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phone,
        channel: "sms",
        locale: twilioLocale,
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Twilio send error", err);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}

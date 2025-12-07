// app/api/phone/send-verification/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const apiKey = process.env.TWILIO_API_KEY!;
const apiSecret = process.env.TWILIO_API_SECRET!;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

// клиент Twilio через API Key (рекомендованный способ)
const client = twilio(apiKey, apiSecret, { accountSid });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone: string = body.phone;
    const locale: string | undefined = body.locale; // "en", "ru", "uk" и т.п.

    if (!phone) {
      return NextResponse.json(
        { error: "Phone is required" },
        { status: 400 }
      );
    }

    // мапим локаль с фронта в формат Twilio
    const localeMap: Record<string, string> = {
      en: "en",
      ru: "ru",
      uk: "uk",   // украинский
      ua: "uk",
    };

    const twilioLocale = localeMap[locale ?? "en"] ?? "en";

    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phone,
        channel: "sms",
        locale: twilioLocale,
      });

    return NextResponse.json({ status: verification.status });
  } catch (error: any) {
    console.error("Twilio send verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}

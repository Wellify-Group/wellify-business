import twilio from "twilio";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Ленивое создание Twilio клиента
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error("Missing Twilio envs", {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
    });
    return null;
  }

  return twilio(accountSid, authToken);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = (body?.phone as string | undefined)?.trim();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone is required" },
        { status: 400 }
      );
    }

    // Простая проверка формата: должен начинаться с "+" и дальше только цифры
    if (!/^\+\d{8,15}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Phone must be in international E.164 format (+380...)" },
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

    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!verifyServiceSid) {
      console.error("Missing TWILIO_VERIFY_SERVICE_SID");
      return NextResponse.json(
        { success: false, error: "Server config error (Twilio Verify Service)" },
        { status: 500 }
      );
    }

    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    return NextResponse.json({ success: true, sid: verification.sid });
  } catch (error: any) {
    console.error("Twilio error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Twilio verification failed",
        message: error?.message ?? "Unknown error",
        code: (error as any)?.code ?? null,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    console.log("[send-verification] Starting verification for:", phone);

    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    console.log("[send-verification] Twilio response:", result);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[send-verification] Twilio error:", err);

    return NextResponse.json(
      {
        error: "Twilio verification failed",
        message: err?.message || null,
        code: err?.code || null,
        moreInfo: err?.moreInfo || null,
        details: err
      },
      { status: 500 }
    );
  }
}

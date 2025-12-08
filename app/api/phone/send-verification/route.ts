import twilio from "twilio";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = (body?.phone as string | undefined)?.trim();

    if (!phone) {
      return Response.json(
        { error: "Phone is required" },
        { status: 400 }
      );
    }

    // Простая проверка формата: должен начинаться с "+" и дальше только цифры
    if (!/^\+\d{8,15}$/.test(phone)) {
      return Response.json(
        { error: "Phone must be in international E.164 format (+380...)" },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !verifyServiceSid) {
      console.error("Missing Twilio envs", {
        hasAccountSid: !!accountSid,
        hasAuthToken: !!authToken,
        hasVerifyServiceSid: !!verifyServiceSid,
      });

      return Response.json(
        { error: "Server config error", message: "Twilio env vars missing" },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    return Response.json({ success: true, sid: verification.sid });
  } catch (error: any) {
    console.error("Twilio error:", error);

    return Response.json(
      {
        error: "Twilio verification failed",
        message: error?.message ?? "Unknown error",
        code: (error as any)?.code ?? null,
      },
      { status: 500 }
    );
  }
}

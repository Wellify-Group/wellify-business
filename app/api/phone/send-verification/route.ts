import twilio from "twilio";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    // 1. Проверяем, что все переменные есть
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

    // 2. Создаём клиента уже после проверки
    const client = twilio(accountSid, authToken);

    // 3. Стартуем Verify
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

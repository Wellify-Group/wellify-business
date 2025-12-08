import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    // Простейшая проверка входных данных
    if (!phone || !code) {
      return Response.json(
        { error: "phone and code are required" },
        { status: 400 }
      );
    }

    // Проверяем код через Twilio Verify
    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({
        to: phone,
        code: code,
      });

    // Twilio вернул статус проверки
    console.log("Twilio verification check:", check.status);

    if (check.status === "approved") {
      // Код правильный
      return Response.json({ success: true });
    }

    // Код неправильный / истёк / слишком много попыток и т.п.
    return Response.json(
      {
        success: false,
        status: check.status,
        error: "Verification code is not approved",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Twilio check error:", error);

    return Response.json(
      {
        error: "Twilio verification failed",
        message: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}

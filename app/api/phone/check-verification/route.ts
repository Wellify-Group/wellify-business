import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getTwilioClient, getVerifyServiceSid } from "@/lib/twilio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
        { success: false, error: "Server config error (Twilio Verify Service)" },
        { status: 500 }
      );
    }

    // Проверяем код через Twilio Verify
    const check = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phone,
        code: code,
      });

    // Twilio вернул статус проверки
    console.log("Twilio verification check:", check.status);

    if (check.status === "approved") {
      // Код правильный - сохраняем телефон в профиль
      try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (!userError && user) {
          // Обновляем профиль с телефоном
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              phone: phone.trim(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (profileError) {
            console.error("Failed to update profile with phone:", profileError);
            // Не возвращаем ошибку, так как телефон уже подтверждён через Twilio
          }

          // Опционально: обновляем телефон в user_metadata
          try {
            await supabase.auth.updateUser({
              data: {
                phone: phone.trim(),
              },
            });
          } catch (metadataError) {
            console.warn("Failed to update user metadata:", metadataError);
            // Не критично
          }
        }
      } catch (profileUpdateError) {
        console.error("Error updating profile with phone:", profileUpdateError);
        // Не возвращаем ошибку, так как телефон уже подтверждён через Twilio
      }

      return NextResponse.json({ success: true });
    }

    // Код неправильный / истёк / слишком много попыток и т.п.
    return NextResponse.json(
      {
        success: false,
        status: check.status,
        error: "Verification code is not approved",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Twilio check error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Twilio verification failed",
        message: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}

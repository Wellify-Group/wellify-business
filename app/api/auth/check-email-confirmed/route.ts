import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не настроены");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, emailConfirmed: false, error: "email_required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.listUsersByEmail(
      email
    );

    if (error) {
      console.error("[check-email-confirmed] admin.listUsersByEmail error", error);
      return NextResponse.json(
        { success: false, emailConfirmed: false, error: "admin_error" },
        { status: 500 }
      );
    }

    const user = data.users?.[0];

    if (!user) {
      return NextResponse.json({
        success: true,
        emailConfirmed: false,
      });
    }

    const emailConfirmed = Boolean(user.email_confirmed_at);

    // Дополнительно: обновим флаг в profiles.email_verified, если такой столбец есть
    if (emailConfirmed) {
      try {
        await supabaseAdmin
          .from("profiles")
          .update({ email_verified: true })
          .eq("id", user.id);
      } catch (e) {
        console.warn("[check-email-confirmed] failed to update profiles.email_verified", e);
      }
    }

    return NextResponse.json({
      success: true,
      emailConfirmed,
    });
  } catch (e) {
    console.error("[check-email-confirmed] unexpected error", e);
    return NextResponse.json(
      { success: false, emailConfirmed: false, error: "unexpected_error" },
      { status: 500 }
    );
  }
}

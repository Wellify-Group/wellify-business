// app/api/auth/check-email-confirmed/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    "[check-email-confirmed] SUPABASE_URL is not set in environment variables"
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "[check-email-confirmed] SUPABASE_SERVICE_ROLE_KEY is not set in environment variables"
  );
}

// Админ-клиент с service_role
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
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

    const normalizedEmail = email.trim().toLowerCase();

    // Берем список пользователей и ищем нужный e-mail
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error(
        "[check-email-confirmed] admin.listUsers error:",
        error.message || error
      );
      return NextResponse.json(
        { success: false, emailConfirmed: false, error: "admin_error" },
        { status: 500 }
      );
    }

    const user =
      data?.users?.find(
        (u) => u.email && u.email.toLowerCase() === normalizedEmail
      ) ?? null;

    // Пользователь в принципе не найден - считаем, что не подтвержден
    if (!user) {
      return NextResponse.json(
        { success: true, emailConfirmed: false },
        { status: 200 }
      );
    }

    // Реальное подтверждение e-mail в Supabase
    // email_confirmed_at заполняется только после клика по ссылке из письма
    const emailConfirmed =
      Boolean((user as any).email_confirmed_at) ||
      Boolean((user as any).confirmed_at) ||
      Boolean((user.user_metadata as any)?.email_verified);

    return NextResponse.json(
      { success: true, emailConfirmed },
      { status: 200 }
    );
  } catch (err) {
    console.error("[check-email-confirmed] unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        emailConfirmed: false,
        error: "unexpected_error",
      },
      { status: 500 }
    );
  }
}

// app/api/auth/check-email-confirmed/route.ts

import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// Принудительно динамический рендеринг, т.к. используем request.url
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Админ-клиент с service_role (единая логика выбора DEV/MAIN ключей)
    const supabaseAdmin = createAdminSupabaseClient();

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

    console.log("[check-email-confirmed] User check:", {
      email: normalizedEmail,
      userId: user.id,
      email_confirmed_at: (user as any).email_confirmed_at,
      confirmed_at: (user as any).confirmed_at,
      email_verified: (user.user_metadata as any)?.email_verified,
      emailConfirmed,
    });

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

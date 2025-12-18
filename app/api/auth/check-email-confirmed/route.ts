// app/api/auth/check-email-confirmed/route.ts (ФИНАЛЬНЫЙ КОД С ЗАЩИТОЙ ОТ ОШИБКИ СБОРКИ)

import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// Принудительно динамический рендеринг, т.к. используем request.url и Admin Client
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Явно указываем Node.js Runtime

export async function GET(req: Request) {
  let supabaseAdmin;
  try {
    // Админ-клиент с service_role (единая логика выбора DEV/MAIN ключей)
    // !!! КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Оборачиваем создание Admin Client в try/catch !!!
    try {
        supabaseAdmin = createAdminSupabaseClient();
    } catch (e) {
        // Если Admin Client не может быть создан (ключи не настроены), 
        // возвращаем 500 ошибку с явным сообщением.
        console.error("[check-email-confirmed] Admin Client Creation Failed:", e);
        return NextResponse.json(
          { 
            success: false, 
            emailConfirmed: false, 
            error: "admin_client_setup_error",
            details: "SUPABASE_SERVICE_ROLE_KEY is likely missing or incorrect."
          },
          { status: 500 }
        );
    }
    // !!! КОНЕЦ КРИТИЧЕСКОГО ИСПРАВЛЕНИЯ !!!


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
    // email_confirmed_at заполняется ТОЛЬКО после клика по ссылке из письма
    // НЕ проверяем user_metadata.email_verified, так как оно может быть установлено вручную
    const emailConfirmed = Boolean((user as any).email_confirmed_at);

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
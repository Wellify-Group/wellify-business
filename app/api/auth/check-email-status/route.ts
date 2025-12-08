import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/auth/check-email-status
 * Проверяет статус подтверждения email по адресу email (без необходимости в сессии)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminSupabaseClient();

    // Проверяем пользователя в auth.users по email (это более надежно)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Получаем список пользователей и ищем по email
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error listing users:", usersError);
      return NextResponse.json(
        { success: false, error: usersError.message },
        { status: 500 }
      );
    }

    const user = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!user) {
      return NextResponse.json({
        success: true,
        emailVerified: false,
        message: "User not found",
      });
    }

    // Проверяем email_confirmed_at из auth.users (это основной источник истины)
    // Важно: проверяем не только наличие, но и что это не null/undefined
    const emailVerified = !!user.email_confirmed_at && user.email_confirmed_at !== null;

    // Дополнительная проверка: убеждаемся, что email_confirmed_at - это валидная дата
    let isValidConfirmation = false;
    if (user.email_confirmed_at) {
      try {
        const confirmedDate = new Date(user.email_confirmed_at);
        isValidConfirmation = !isNaN(confirmedDate.getTime()) && confirmedDate.getTime() > 0;
      } catch (e) {
        isValidConfirmation = false;
      }
    }

    const finalEmailVerified = emailVerified && isValidConfirmation;

    return NextResponse.json({
      success: true,
      emailVerified: finalEmailVerified,
      userId: user.id,
      emailConfirmedAt: user.email_confirmed_at,
    });
  } catch (error: any) {
    console.error("Unexpected error checking email status:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


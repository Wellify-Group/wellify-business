// app/api/auth/resend-confirmation/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Админ-клиент Supabase (service role)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const body = await request.json();
    const { email } = body ?? {};

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Проверяем, существует ли пользователь
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("[resend-confirmation] listUsers error:", listError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check user",
          errorCode: "USER_CHECK_ERROR",
        },
        { status: 500 }
      );
    }

    const user = usersData?.users?.find(
      (u) => u.email && u.email.toLowerCase() === normalizedEmail
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          errorCode: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Проверяем, не подтвержден ли уже email
    if (user.email_confirmed_at) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already confirmed",
          errorCode: "EMAIL_ALREADY_CONFIRMED",
        },
        { status: 400 }
      );
    }

    // Получаем базовый URL для redirect
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      (request.headers.get("origin") || "http://localhost:3000");

    const redirectTo = `${baseUrl}/auth/callback`;

    // Генерируем новый токен подтверждения и отправляем письмо
    const { data: resendData, error: resendError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: normalizedEmail,
        options: {
          redirectTo,
        },
      });

    if (resendError) {
      console.error("[resend-confirmation] generateLink error:", resendError);
      
      // Если generateLink не работает, попробуем через resend
      const { error: resendEmailError } = await supabaseAdmin.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (resendEmailError) {
        console.error("[resend-confirmation] resend error:", resendEmailError);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to resend confirmation email",
            errorCode: "RESEND_ERROR",
            details: resendEmailError.message,
          },
          { status: 500 }
        );
      }
    }

    console.log("[resend-confirmation] Confirmation email resent successfully for:", normalizedEmail);

    return NextResponse.json(
      {
        success: true,
        message: "Confirmation email sent",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[resend-confirmation] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}


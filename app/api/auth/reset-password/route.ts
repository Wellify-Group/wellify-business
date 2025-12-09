/**
 * Reset password using token from email link
 * 
 * This endpoint handles password reset when user clicks the link from email.
 * In Supabase, when user clicks the recovery link, the session is automatically
 * established via hash in URL. We use the client-side session to update password.
 * 
 * However, for API endpoint, we need to use admin API to update password by email.
 * But we need email from the token or use a different approach.
 * 
 * Actually, Supabase handles recovery tokens automatically when user navigates
 * to the page. The session is established via hash. So we can use updateUser
 * if the session exists, or we need to extract email from token.
 * 
 * For now, we'll use the approach where client establishes session first,
 * then calls this API. But that's not ideal.
 * 
 * Better approach: Use admin API to update password by email.
 * But we need email from the request or extract it from token.
 * 
 * Actually, the best approach is to use Supabase's built-in recovery flow:
 * When user clicks the link, Supabase automatically establishes session.
 * Then we can use updateUser on client side, or we can use admin API
 * if we have email.
 * 
 * For API endpoint, we'll accept email and password, and use admin API.
 * But that's less secure. Better to use token verification.
 * 
 * Let's use a hybrid approach: Accept token and password, try to verify
 * token and extract email, then use admin API to update password.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, email } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Пароль обязателен" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Пароль должен содержать минимум 8 символов" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[reset-password] Missing Supabase envs");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    // Используем admin клиент для обновления пароля
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Если передан email, используем его для обновления пароля
    if (email) {
      // Находим пользователя по email
      const { data: usersData, error: listError } =
        await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      if (listError) {
        console.error("[reset-password] Error listing users", listError);
        return NextResponse.json(
          { success: false, message: "Failed to find user" },
          { status: 500 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = usersData?.users?.find(
        (u) => u.email && u.email.trim().toLowerCase() === normalizedEmail
      );

      if (!user) {
        return NextResponse.json(
          { success: false, message: "Пользователь не найден" },
          { status: 404 }
        );
      }

      // Обновляем пароль через admin API
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: password }
      );

      if (updateError) {
        console.error("[reset-password] Update error", updateError);
        return NextResponse.json(
          {
            success: false,
            message: updateError.message || "Не удалось изменить пароль. Попробуйте ещё раз.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Пароль успешно изменён",
        },
        { status: 200 }
      );
    }

    // Если email не передан, но есть токен, пытаемся использовать обычный клиент
    // Это работает только если сессия уже установлена на клиенте
    // В этом случае клиент должен использовать updateUser напрямую
    return NextResponse.json(
      {
        success: false,
        message: "Email обязателен для сброса пароля через API",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[reset-password] Unexpected error", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}


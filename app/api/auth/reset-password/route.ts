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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, code } = body;

    if (!email || !password || !code) {
      return NextResponse.json(
        { success: false, error: "Email, password and code are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Пароль должен содержать минимум 8 символов" },
        { status: 400 }
      );
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Валидация кода (6 цифр)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: "Invalid code format. Code must be 6 digits" },
        { status: 400 }
      );
    }

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

    if (!BACKEND_URL) {
      return NextResponse.json(
        { success: false, error: "Backend URL is not configured" },
        { status: 500 }
      );
    }

    // First verify the code
    const verifyResponse = await fetch(`${BACKEND_URL}/api/email-verification/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    if (!verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      return NextResponse.json(
        { success: false, error: verifyData.error || "Invalid or expired code" },
        { status: verifyResponse.status }
      );
    }

    // Code is verified, now get user and update password
    // We need to get userId from the verification response or query it
    // For now, we'll need to add a reset-password-by-code endpoint to backend
    // Or we can call check-email to get user info, then update password
    
    // Check user exists
    const checkResponse = await fetch(`${BACKEND_URL}/api/auth/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!checkResponse.ok) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // TODO: Backend needs a reset-password-by-code endpoint
    // For now, we'll need to add this endpoint to backend
    // OR use forgot-password to get token, then reset-password with token
    // But that's not ideal with code flow
    
    // Temporary: Use a workaround - we verified the code, now we need to reset password
    // Backend should have: POST /api/auth/reset-password-by-code
    // For now, return error saying we need to implement this in backend
    
    return NextResponse.json(
      {
        success: false,
        error: "Password reset by code not yet implemented in backend. Please use token-based reset.",
      },
      { status: 501 }
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
  
  /* OLD CODE - TEMPORARILY DISABLED FOR MIGRATION
  try {
    const body = await request.json();
    const { email, password, code } = body;

    if (!email || !password || !code) {
      return NextResponse.json(
        { success: false, error: "Email, password and code are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Пароль должен содержать минимум 8 символов" },
        { status: 400 }
      );
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Валидация кода (6 цифр)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: "Invalid code format. Code must be 6 digits" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[reset-password] Missing Supabase envs");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
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

    // Проверяем код
    const { data: verification, error: findError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('token', code)
      .not('verified_at', 'is', null) // Код должен быть подтвержден
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !verification) {
      return NextResponse.json(
        { success: false, error: "Invalid or unverified code" },
        { status: 400 }
      );
    }

    // Находим пользователя по email
    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (listError) {
      console.error("[reset-password] Error listing users", listError);
      return NextResponse.json(
        { success: false, error: "Failed to find user" },
        { status: 500 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersData?.users?.find(
      (u) => u.email && u.email.trim().toLowerCase() === normalizedEmail
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
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
          error: updateError.message || "Не удалось изменить пароль. Попробуйте ещё раз.",
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
  */
}


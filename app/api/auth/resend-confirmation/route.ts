// app/api/auth/resend-confirmation/route.ts
// Проксирует запрос на backend для повторной отправки кода верификации

import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!API_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "Backend API is not configured",
          errorCode: "API_NOT_CONFIGURED",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, userId, language = 'uk' } = body ?? {};

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

    // Проксируем на backend для повторной отправки кода верификации
    const response = await fetch(`${API_URL}/api/email-verification/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        userId,
        language,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          errorCode: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

      return NextResponse.json(
        {
          success: false,
          error: data.error || "Failed to resend confirmation code",
          errorCode: "RESEND_ERROR",
        },
        { status: response.status }
      );
    }

    console.log("[resend-confirmation] Verification code resent successfully for:", normalizedEmail);

    return NextResponse.json(
      {
        success: true,
        message: "Verification code sent",
      },
      { status: 200 }
    );
  } catch (error: any) {
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


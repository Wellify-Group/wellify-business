import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const token = url.searchParams.get("token");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  // Если есть token или token_hash в query (формат ссылок Supabase)
  // Обрабатываем токен ТОЛЬКО после перехода по ссылке из письма
  if ((token || tokenHash) && type === "signup") {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash || token || "",
        type: 'signup',
      });

      if (error) {
        // Проверяем, не является ли ошибка "already confirmed" или "token already used"
        const errorMsg = error.message?.toLowerCase() || "";
        if (
          errorMsg.includes("already confirmed") ||
          errorMsg.includes("email already verified") ||
          errorMsg.includes("token already used") ||
          errorMsg.includes("link has already been used")
        ) {
          return NextResponse.redirect(new URL("/auth/email-confirmed?status=already_confirmed", url));
        }

        console.error("[auth/confirm] verifyOtp error:", error);
        return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
      }

      // Успешное подтверждение
      return NextResponse.redirect(new URL("/auth/email-confirmed?status=success", url));
    } catch (err: any) {
      console.error("[auth/confirm] Unexpected error (token):", err);
      return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
    }
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/confirm] exchangeCodeForSession error:", error);
      
      // Проверяем, не является ли ошибка "already confirmed" или "token already used"
      const errorMsg = error.message?.toLowerCase() || "";
      if (
        errorMsg.includes("already confirmed") ||
        errorMsg.includes("email already verified") ||
        errorMsg.includes("token already used") ||
        errorMsg.includes("link has already been used") ||
        errorMsg.includes("already been verified")
      ) {
        return NextResponse.redirect(new URL("/auth/email-confirmed?status=already_confirmed", url));
      }

      return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
    }

    // Успешное подтверждение
    return NextResponse.redirect(new URL("/auth/email-confirmed?status=success", url));
  } catch (err: any) {
    console.error("[auth/confirm] Unexpected error:", err);
    return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
  }
}


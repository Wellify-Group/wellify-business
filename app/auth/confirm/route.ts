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

  console.log("[auth/confirm] Request received:", {
    code: code ? `${code.substring(0, 20)}...` : null,
    token: token ? `${token.substring(0, 20)}...` : null,
    tokenHash: tokenHash ? `${tokenHash.substring(0, 20)}...` : null,
    type,
    allParams: Object.fromEntries(url.searchParams.entries())
  });

  // Если есть token или token_hash в query (формат ссылок Supabase)
  // Обрабатываем токен ТОЛЬКО после перехода по ссылке из письма
  // type может быть "signup" или отсутствовать - пробуем обработать в любом случае
  if (token || tokenHash) {
    try {
      const supabase = await createServerSupabaseClient();
      // Используем type из URL, если есть, иначе пробуем 'signup'
      const otpType = type || 'signup';
      console.log("[auth/confirm] Attempting verifyOtp with type:", otpType);
      
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash || token || "",
        type: otpType as any,
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
      console.log("[auth/confirm] verifyOtp success, user:", data.user?.id);
      return NextResponse.redirect(new URL("/auth/email-confirmed?status=success", url));
    } catch (err: any) {
      console.error("[auth/confirm] Unexpected error (token):", err);
      return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
    }
  }

  // Если есть code, обрабатываем через exchangeCodeForSession
  if (code) {
    console.log("[auth/confirm] Processing code via exchangeCodeForSession");

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
    console.log("[auth/confirm] exchangeCodeForSession success, user:", data.user?.id);
    return NextResponse.redirect(new URL("/auth/email-confirmed?status=success", url));
  } catch (err: any) {
    console.error("[auth/confirm] Unexpected error:", err);
    return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
  }
  }

  // Если нет ни code, ни token - это невалидный запрос
  console.log("[auth/confirm] No code or token provided, redirecting to invalid_or_expired");
  return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
}


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

  // Логируем полный URL для отладки
  console.log("[auth/confirm] Full URL:", url.toString());
  console.log("[auth/confirm] Request params:", { 
    code: code ? `${code.substring(0, 20)}...` : null, 
    token: token ? `${token.substring(0, 20)}...` : null, 
    tokenHash: tokenHash ? `${tokenHash.substring(0, 20)}...` : null, 
    type,
    allParams: Object.fromEntries(url.searchParams.entries())
  });

  // Если есть token или token_hash в query (формат ссылок Supabase)
  if ((token || tokenHash) && type === "signup") {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash || token || "",
        type: 'signup',
      });

      if (error) {
        console.error("[auth/confirm] verifyOtp error:", error.message, error.status);
        
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

  // Если нет ни code, ни token - это невалидный запрос
  if (!code) {
    console.log("[auth/confirm] No code or token provided");
    return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/confirm] exchangeCodeForSession error:", error.message, error.status);
      
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


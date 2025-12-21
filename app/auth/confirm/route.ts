import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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

  // ПРИОРИТЕТ: Сначала обрабатываем code (PKCE flow) - это основной метод для email confirmation
  if (code) {
    console.log("[auth/confirm] Processing code via exchangeCodeForSession (PKCE flow)");

    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[auth/confirm] exchangeCodeForSession error:", error.message);
        
        // Проверяем, не является ли ошибка "already confirmed" или "token already used"
        const errorMsg = error.message?.toLowerCase() || "";
        if (
          errorMsg.includes("already confirmed") ||
          errorMsg.includes("email already verified") ||
          errorMsg.includes("token already used") ||
          errorMsg.includes("link has already been used") ||
          errorMsg.includes("already been verified")
        ) {
          // Если ссылка уже использована - это не ошибка, показываем already_confirmed
          // Проверяем, что email действительно подтвержден
          try {
            const supabaseAdmin = createAdminSupabaseClient();
            // Пытаемся найти пользователя по email из кода (если возможно)
            // Но проще проверить через getUser после редиректа
          } catch (e) {
            console.error("[auth/confirm] Error checking already confirmed user:", e);
          }
          return NextResponse.redirect(new URL("/auth/email-confirmed?status=already_confirmed", url));
        }

        // Если код недействителен или истек - показываем "Ссылка недействительна"
        console.log("[auth/confirm] Code invalid or expired");
        return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
      }

      // Успешное подтверждение через PKCE
      console.log("[auth/confirm] exchangeCodeForSession success, user:", data.user?.id, "email_confirmed_at:", data.user?.email_confirmed_at);
      
      // КРИТИЧНО: email_confirmed_at устанавливается Supabase только при успешном exchangeCodeForSession
      // Триггер в БД автоматически обновит profiles.email_verified = true
      // НЕ нужно вручную обновлять profiles - триггер сделает это автоматически
      if (data.user?.id && data.user?.email && (data.user as any).email_confirmed_at) {
        console.log("[auth/confirm] ✅ Email confirmed, trigger will sync profiles.email_verified automatically");
      } else {
        // Если email_confirmed_at не установлен - это ошибка
        console.error("[auth/confirm] email_confirmed_at is not set after exchangeCodeForSession");
      }
      
      return NextResponse.redirect(new URL("/auth/email-confirmed?status=success", url));
    } catch (err: any) {
      console.error("[auth/confirm] Unexpected error (code):", err);
      return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
    }
  }

  // Fallback: Если есть token или token_hash в query (старый формат ссылок Supabase)
  // Обрабатываем токен ТОЛЬКО после перехода по ссылке из письма
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
          // Если ссылка уже использована - это не ошибка, показываем already_confirmed
          return NextResponse.redirect(new URL("/auth/email-confirmed?status=already_confirmed", url));
        }

        console.error("[auth/confirm] verifyOtp error:", error);
        
        // Если токен недействителен - показываем "Ссылка недействительна"
        return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
      }

      // Успешное подтверждение
      console.log("[auth/confirm] verifyOtp success, user:", data.user?.id);
      
      // КРИТИЧНО: email_confirmed_at устанавливается Supabase только при успешном verifyOtp
      // Триггер в БД автоматически обновит profiles.email_verified = true
      // НЕ нужно вручную обновлять profiles - триггер сделает это автоматически
      if (data.user?.id && data.user?.email && (data.user as any).email_confirmed_at) {
        console.log("[auth/confirm] ✅ Email confirmed, trigger will sync profiles.email_verified automatically");
      }
      
      // Редиректим на страницу успешного подтверждения
      return NextResponse.redirect(new URL("/auth/email-confirmed?status=success", url));
    } catch (err: any) {
      console.error("[auth/confirm] Unexpected error (token):", err);
      return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
    }
  }


  // Если нет ни code, ни token - это невалидный запрос
  console.log("[auth/confirm] No code or token provided, redirecting to invalid_or_expired");
  return NextResponse.redirect(new URL("/auth/email-confirmed?status=invalid_or_expired", url));
}


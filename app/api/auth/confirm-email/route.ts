// app/api/auth/confirm-email/route.ts
// Эндпоинт для обработки подтверждения email через Railway прокси
// Проверяет первый/повторный клик и редиректит на соответствующие страницы

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Получаем базовый URL фронтенда для редиректов
function getFrontendBaseUrl(): string {
  // Используем переменную окружения для URL фронтенда
  // Для dev: https://dev.wellifyglobal.com
  // Для production: https://business.wellifyglobal.com
  const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.APP_BASE_URL || 
                     (process.env.NODE_ENV === 'production' 
                       ? 'https://business.wellifyglobal.com'
                       : 'https://dev.wellifyglobal.com');
  return frontendUrl;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const token = url.searchParams.get("token");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  console.log("[confirm-email] Request received:", {
    code: code ? `${code.substring(0, 20)}...` : null,
    token: token ? `${token.substring(0, 20)}...` : null,
    tokenHash: tokenHash ? `${tokenHash.substring(0, 20)}...` : null,
    type,
  });

  const frontendBaseUrl = getFrontendBaseUrl();

  // Проверяем наличие параметров
  if (!code && !token && !tokenHash) {
    console.log("[confirm-email] No confirmation parameters provided");
    return NextResponse.redirect(
      new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
    );
  }

  try {
    const supabaseAdmin = createAdminSupabaseClient();

    // Приоритет: обрабатываем code (PKCE flow) - основной метод для email confirmation
    if (code) {
      console.log("[confirm-email] Processing code via exchangeCodeForSession (PKCE flow)");

      try {
        const supabase = await createServerSupabaseClient();
        
        // Получаем пользователя ДО exchangeCodeForSession, чтобы проверить, подтвержден ли уже email
        // Но для этого нужен другой способ, так как code нельзя декодировать без exchange
        // Поэтому сначала пробуем exchange, и если получаем ошибку "already confirmed" - это повторный клик
        
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("[confirm-email] exchangeCodeForSession error:", error.message);
          
          const errorMsg = error.message?.toLowerCase() || "";
          
          // Проверяем, является ли это ошибкой "already confirmed"
          if (
            errorMsg.includes("already confirmed") ||
            errorMsg.includes("email already verified") ||
            errorMsg.includes("token already used") ||
            errorMsg.includes("link has already been used") ||
            errorMsg.includes("already been verified")
          ) {
            // ПОВТОРНЫЙ КЛИК - пользователь уже подтверждал email
            console.log("[confirm-email] ✅ Email already confirmed (repeated click)");
            
            // Проверяем, действительно ли email подтвержден в БД
            // Пытаемся найти пользователя через admin API
            try {
              // Извлекаем userId из ошибки или пытаемся найти пользователя другим способом
              // Но так как у нас нет userId, просто редиректим на страницу "already confirmed"
              return NextResponse.redirect(
                new URL(`${frontendBaseUrl}/auth/email-confirmed?status=already_confirmed`)
              );
            } catch (e) {
              console.error("[confirm-email] Error checking already confirmed user:", e);
              return NextResponse.redirect(
                new URL(`${frontendBaseUrl}/auth/email-confirmed?status=already_confirmed`)
              );
            }
          }

          // Если код недействителен или истек
          console.log("[confirm-email] Code invalid or expired");
          return NextResponse.redirect(
            new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
          );
        }

        // УСПЕШНОЕ ПОДТВЕРЖДЕНИЕ (ПЕРВЫЙ КЛИК)
        // Если exchangeCodeForSession успешен - это гарантированно первый раз,
        // так как Supabase не позволит использовать один и тот же code дважды
        if (data.user?.id && data.user?.email && (data.user as any).email_confirmed_at) {
          console.log("[confirm-email] ✅ Email confirmed successfully (first click), user:", data.user.id);
          
          // Редиректим на страницу успеха
          return NextResponse.redirect(
            new URL(`${frontendBaseUrl}/auth/email-confirmed?status=success`)
          );
        } else {
          console.error("[confirm-email] email_confirmed_at is not set after exchangeCodeForSession");
          return NextResponse.redirect(
            new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
          );
        }
      } catch (err: any) {
        console.error("[confirm-email] Unexpected error (code):", err);
        return NextResponse.redirect(
          new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
        );
      }
    }

    // Fallback: обработка token/token_hash (старый формат Supabase)
    if (token || tokenHash) {
      try {
        const supabase = await createServerSupabaseClient();
        const otpType = type || 'signup';
        console.log("[confirm-email] Attempting verifyOtp with type:", otpType);
        
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash || token || "",
          type: otpType as any,
        });

        if (error) {
          const errorMsg = error.message?.toLowerCase() || "";
          
          if (
            errorMsg.includes("already confirmed") ||
            errorMsg.includes("email already verified") ||
            errorMsg.includes("token already used") ||
            errorMsg.includes("link has already been used")
          ) {
            // ПОВТОРНЫЙ КЛИК
            console.log("[confirm-email] ✅ Email already confirmed (repeated click via token)");
            return NextResponse.redirect(
              new URL(`${frontendBaseUrl}/auth/email-confirmed?status=already_confirmed`)
            );
          }

          console.error("[confirm-email] verifyOtp error:", error);
          return NextResponse.redirect(
            new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
          );
        }

        // УСПЕШНОЕ ПОДТВЕРЖДЕНИЕ (ПЕРВЫЙ КЛИК)
        if (data.user?.id && data.user?.email && (data.user as any).email_confirmed_at) {
          console.log("[confirm-email] ✅ Email confirmed successfully (first click via token), user:", data.user.id);
          return NextResponse.redirect(
            new URL(`${frontendBaseUrl}/auth/email-confirmed?status=success`)
          );
        }

        return NextResponse.redirect(
          new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
        );
      } catch (err: any) {
        console.error("[confirm-email] Unexpected error (token):", err);
        return NextResponse.redirect(
          new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
        );
      }
    }

    // Если мы дошли сюда - что-то не так
    return NextResponse.redirect(
      new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
    );

  } catch (err: any) {
    console.error("[confirm-email] Unexpected error:", err);
    return NextResponse.redirect(
      new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
    );
  }
}


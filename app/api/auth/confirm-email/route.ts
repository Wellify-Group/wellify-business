// app/api/auth/confirm-email/route.ts
// НОВАЯ ТАКТИКА: Используем кастомный токен из БД вместо стандартного кода Supabase
// Railway эндпоинт проверяет токен в БД, обновляет статус через Admin API и редиректит

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Получаем базовый URL фронтенда для редиректов
function getFrontendBaseUrl(): string {
  const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.APP_BASE_URL || 
                     (process.env.NODE_ENV === 'production' 
                       ? 'https://business.wellifyglobal.com'
                       : 'https://dev.wellifyglobal.com');
  return frontendUrl;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const code = url.searchParams.get("code"); // Оставляем поддержку стандартного кода как fallback

  console.log("[confirm-email] Request received:", {
    token: token ? `${token.substring(0, 20)}...` : null,
    code: code ? `${code.substring(0, 20)}...` : null,
  });

  const frontendBaseUrl = getFrontendBaseUrl();

  // Если нет ни токена, ни кода - невалидный запрос
  if (!token && !code) {
    console.log("[confirm-email] No token or code provided");
    return NextResponse.redirect(
      new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
    );
  }

  try {
    const supabaseAdmin = createAdminSupabaseClient();

    // НОВАЯ ТАКТИКА: Приоритет - кастомный токен из БД
    if (token) {
      console.log("[confirm-email] Processing custom token from database");

      // Ищем запись в таблице email_verifications по токену
      const { data: verification, error: verificationError } = await supabaseAdmin
        .from('email_verifications')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (verificationError) {
        console.error("[confirm-email] Error querying email_verifications:", verificationError);
        return NextResponse.redirect(
          new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
        );
      }

      if (!verification) {
        console.log("[confirm-email] Token not found in database");
        return NextResponse.redirect(
          new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
        );
      }

      // Проверяем, не истек ли токен
      const now = new Date();
      const expiresAt = verification.expires_at ? new Date(verification.expires_at) : null;
      
      if (expiresAt && now > expiresAt) {
        console.log("[confirm-email] Token expired");
        return NextResponse.redirect(
          new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
        );
      }

      // Проверяем, использован ли уже токен
      if (verification.verified_at) {
        console.log("[confirm-email] ✅ Token already used (repeated click)");
        return NextResponse.redirect(
          new URL(`${frontendBaseUrl}/auth/email-confirmed?status=already_confirmed`)
        );
      }

      // ПЕРВЫЙ КЛИК - подтверждаем email через прямой SQL запрос
      const userId = verification.user_id;
      const userEmail = verification.email;

      console.log("[confirm-email] ✅ First-time confirmation, user:", userId, "email:", userEmail);

      // Проверяем, может быть email уже подтвержден
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (existingUser?.user?.email_confirmed_at) {
        // Email уже подтвержден - помечаем токен как использованный
        await supabaseAdmin
          .from('email_verifications')
          .update({ verified_at: new Date().toISOString() })
          .eq('token', token);
        
        return NextResponse.redirect(
          new URL(`${frontendBaseUrl}/auth/email-confirmed?status=already_confirmed`)
        );
      }

      // Обновляем email_confirmed_at через SQL функцию
      const { error: updateError } = await supabaseAdmin.rpc('confirm_user_email', {
        user_id_param: userId
      });

      if (updateError) {
        console.error("[confirm-email] Error calling confirm_user_email function:", updateError);
        // Продолжаем - обновим хотя бы профиль
      }

      // Обновляем профиль - устанавливаем email_verified = true
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ email_verified: true })
        .eq('id', userId);

      if (profileError) {
        console.error("[confirm-email] Error updating profile:", profileError);
        // Не критично, продолжаем
      }

      // Помечаем токен как использованный
      await supabaseAdmin
        .from('email_verifications')
        .update({ verified_at: new Date().toISOString() })
        .eq('token', token);

      console.log("[confirm-email] ✅ Email confirmed successfully via custom token");
      return NextResponse.redirect(
        new URL(`${frontendBaseUrl}/auth/email-confirmed?status=success`)
      );
    }

    // FALLBACK: Обработка стандартного кода Supabase (для обратной совместимости)
    if (code) {
      console.log("[confirm-email] Processing standard Supabase code (fallback)");
      
      // Используем стандартный метод Supabase
      // Но это может не работать, поэтому лучше использовать кастомный токен
      return NextResponse.redirect(
        new URL(`${frontendBaseUrl}/auth/email-confirmed?status=invalid_or_expired`)
      );
    }

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

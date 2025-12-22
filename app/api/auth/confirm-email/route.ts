// app/api/auth/confirm-email/route.ts
// Обрабатывает клик по ссылке подтверждения email из письма

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Получаем URL фронтенда для редиректа
function getFrontendUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 
         (process.env.NODE_ENV === 'production' 
           ? 'https://business.wellifyglobal.com'
           : 'https://dev.wellifyglobal.com');
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  console.log("[confirm-email] Request received:", {
    token: token ? `${token.substring(0, 20)}...` : null,
  });

  const frontendUrl = getFrontendUrl();

  // Если нет токена - невалидный запрос
  if (!token) {
    console.log("[confirm-email] No token provided");
    return NextResponse.redirect(
      new URL(`${frontendUrl}/auth/email-confirmed?status=invalid`)
    );
  }

  try {
    const supabaseAdmin = createAdminSupabaseClient();

    // Хешируем токен для поиска в БД
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Ищем запись в таблице email_verifications
    const { data: verification, error: verificationError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (verificationError) {
      console.error("[confirm-email] Error querying email_verifications:", verificationError);
      return NextResponse.redirect(
        new URL(`${frontendUrl}/auth/email-confirmed?status=error`)
      );
    }

    if (!verification) {
      console.log("[confirm-email] Token not found in database");
      return NextResponse.redirect(
        new URL(`${frontendUrl}/auth/email-confirmed?status=invalid`)
      );
    }

    // Проверяем, не истек ли токен
    const now = new Date();
    const expiresAt = verification.expires_at ? new Date(verification.expires_at) : null;
    
    if (expiresAt && now > expiresAt) {
      console.log("[confirm-email] Token expired");
      return NextResponse.redirect(
        new URL(`${frontendUrl}/auth/email-confirmed?status=expired`)
      );
    }

    // Проверяем, использован ли уже токен (повторный клик)
    if (verification.used_at) {
      console.log("[confirm-email] ✅ Token already used (repeated click)");
      return NextResponse.redirect(
        new URL(`${frontendUrl}/auth/email-confirmed?status=already_confirmed`)
      );
    }

    // ПЕРВЫЙ КЛИК - подтверждаем email
    const userId = verification.user_id;
    
    if (!userId) {
      console.error("[confirm-email] user_id is null in verification record");
      return NextResponse.redirect(
        new URL(`${frontendUrl}/auth/email-confirmed?status=error`)
      );
    }

    console.log("[confirm-email] ✅ First-time confirmation, user:", userId);

    // Проверяем, может быть email уже подтвержден (на случай race condition)
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (existingUser?.user?.email_confirmed_at) {
      // Email уже подтвержден - просто помечаем токен как использованный
      await supabaseAdmin
        .from('email_verifications')
        .update({ used_at: new Date().toISOString() })
        .eq('token_hash', tokenHash);
      
      return NextResponse.redirect(
        new URL(`${frontendUrl}/auth/email-confirmed?status=already_confirmed`)
      );
    }

    // Обновляем email_confirmed_at через SQL функцию
    const { error: updateError } = await supabaseAdmin.rpc('confirm_user_email', {
      user_id_param: userId
    });

    if (updateError) {
      console.error("[confirm-email] Error calling confirm_user_email function:", updateError);
      return NextResponse.redirect(
        new URL(`${frontendUrl}/auth/email-confirmed?status=error`)
      );
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
      .update({ used_at: new Date().toISOString() })
      .eq('token_hash', tokenHash);

    console.log("[confirm-email] ✅ Email confirmed successfully");
    return NextResponse.redirect(
      new URL(`${frontendUrl}/auth/email-confirmed?status=success`)
    );

  } catch (err: any) {
    console.error("[confirm-email] Unexpected error:", err);
    return NextResponse.redirect(
      new URL(`${frontendUrl}/auth/email-confirmed?status=error`)
    );
  }
}

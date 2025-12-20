// app/api/auth/check-email-confirmed/route.ts
// Проверяет подтверждение email через getUserById (userId обязателен)

import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// Принудительно динамический рендеринг
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  // Логирование env переменных (только на сервере)
  const { logSupabaseEnv } = await import('@/lib/supabase/env');
  logSupabaseEnv('check-email-confirmed');

  let supabaseAdmin;
  try {
    supabaseAdmin = createAdminSupabaseClient();
  } catch (e: any) {
    console.error('[check-email-confirmed] Admin Client Creation Failed:', e?.message);
    return NextResponse.json(
      {
        success: false,
        emailConfirmed: false,
        error: 'admin_client_setup_error',
        details: 'SUPABASE_SERVICE_ROLE_KEY is likely missing or incorrect.',
      },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, emailConfirmed: false, error: 'userId_required' },
        { status: 400 }
      );
    }

    // Используем getUserById (надежный метод, не зависит от поиска по email)
    const { data: userData, error: getUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError) {
      console.error('[check-email-confirmed] getUserById error:', getUserError.message);
      return NextResponse.json(
        { success: false, emailConfirmed: false, error: 'user_not_found' },
        { status: 404 }
      );
    }

    const user = userData?.user ?? null;

    // Пользователь не найден
    if (!user) {
      return NextResponse.json(
        { success: true, emailConfirmed: false },
        { status: 200 }
      );
    }

    // Реальное подтверждение e-mail в Supabase
    // email_confirmed_at заполняется ТОЛЬКО после клика по ссылке из письма
    // Также проверяем email_verified в profiles для надежности
    const emailConfirmedInAuth = Boolean((user as any).email_confirmed_at);
    
    // Проверяем также email_verified в profiles (может быть установлен триггером или API)
    let emailVerifiedInProfile = false;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email_verified')
        .eq('id', userId)
        .maybeSingle();
      
      emailVerifiedInProfile = Boolean(profile?.email_verified);
    } catch (profileError) {
      console.error('[check-email-confirmed] Profile check error:', profileError);
    }
    
    // Email считается подтвержденным, если подтвержден в Auth ИЛИ в профиле
    const emailConfirmed = emailConfirmedInAuth || emailVerifiedInProfile;

    // Безопасное логирование (без PII)
    const maskedEmail = user.email
      ? `${user.email.substring(0, 3)}***@${user.email.split('@')[1] ?? '***'}`
      : 'N/A';
    console.log('[check-email-confirmed] User check:', {
      userId: user.id,
      email: maskedEmail,
      email_confirmed_at: (user as any).email_confirmed_at ? 'SET' : 'NULL',
      email_verified_in_profile: emailVerifiedInProfile,
      emailConfirmed,
    });

    return NextResponse.json(
      { 
        success: true, 
        emailConfirmed, 
        emailVerified: emailVerifiedInProfile,
        // Для обратной совместимости
        emailConfirmedInAuth: emailConfirmedInAuth,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[check-email-confirmed] unexpected error:', err?.message || err);
    return NextResponse.json(
      {
        success: false,
        emailConfirmed: false,
        error: 'unexpected_error',
      },
      { status: 500 }
    );
  }
}

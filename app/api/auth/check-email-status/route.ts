// app/api/auth/check-email-status/route.ts
// Проверяет статус подтверждения email для polling на фронтенде

import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    // Поддерживаем оба параметра: userId (приоритет) или email
    if (!userId && !email) {
      return NextResponse.json(
        { success: false, emailVerified: false, error: 'userId_or_email_required' },
        { status: 400 }
      );
    }

    let userData;
    let getUserError;

    if (userId) {
      // Используем getUserById (надежный метод)
      const result = await supabaseAdmin.auth.admin.getUserById(userId);
      userData = result.data;
      getUserError = result.error;
    } else if (email) {
      // Ищем пользователя по email
      const normalizedEmail = email.toLowerCase().trim();
      const result = await supabaseAdmin.auth.admin.listUsers();
      
      if (result.error) {
        getUserError = result.error;
      } else {
        const user = result.data.users.find(u => u.email?.toLowerCase().trim() === normalizedEmail);
        if (user) {
          userData = { user };
        } else {
          getUserError = { message: 'user_not_found' };
        }
      }
    }

    if (getUserError) {
      console.error('[check-email-status] Error getting user:', getUserError.message);
      return NextResponse.json(
        { success: false, emailVerified: false, error: 'user_not_found' },
        { status: 404 }
      );
    }

    const user = userData?.user ?? null;

    if (!user) {
      return NextResponse.json(
        { success: true, emailVerified: false },
        { status: 200 }
      );
    }

    // Проверяем email_verified в profiles (основной индикатор)
    let emailVerifiedInProfile = false;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email_verified')
        .eq('id', user.id)
        .maybeSingle();
      
      emailVerifiedInProfile = Boolean(profile?.email_verified);
    } catch (profileError) {
      console.error('[check-email-status] Profile check error:', profileError);
    }
    
    // Также проверяем email_confirmed_at для дополнительной информации
    const emailConfirmedInAuth = Boolean((user as any).email_confirmed_at);

    // Основной индикатор - email_verified из profiles
    const emailVerified = emailVerifiedInProfile;

    console.log('[check-email-status] User check:', {
      userId: user.id,
      emailVerified,
      emailConfirmedInAuth,
    });

    return NextResponse.json(
      { 
        success: true, 
        emailVerified: emailVerified,
        emailConfirmed: emailVerified, // Для обратной совместимости
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[check-email-status] Unexpected error:', err?.message || err);
    return NextResponse.json(
      {
        success: false,
        emailVerified: false,
        error: 'unexpected_error',
      },
      { status: 500 }
    );
  }
}

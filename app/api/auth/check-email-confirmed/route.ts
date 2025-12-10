// app/api/auth/check-email-confirmed/route.ts

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Проверяет статус email_verified в таблице profiles
 * Возвращает emailConfirmed: true ТОЛЬКО если profiles.email_verified = TRUE
 * Мониторит изменения в этой ячейке каждую секунду
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, emailConfirmed: false, reason: 'unauthorized' },
        { status: 401 },
      );
    }

    // КРИТИЧНО: Проверяем ТОЛЬКО profiles.email_verified из базы данных
    // Это поле обновляется триггером или вручную в Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email_verified')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[check-email-confirmed] Error fetching profile', {
        error: profileError,
        userId: user.id,
        email: user.email,
      });
      // Если профиль не найден, считаем email не подтверждённым
      return NextResponse.json({
        success: true,
        emailConfirmed: false,
      });
    }

    const emailConfirmed = profile?.email_verified === true;

    // Детальное логирование для отладки
    console.log('[check-email-confirmed] Profile check result', {
      userId: user.id,
      email: user.email,
      email_verified: profile?.email_verified,
      emailConfirmed,
    });

    return NextResponse.json({
      success: true,
      emailConfirmed,
    });
  } catch (err: any) {
    console.error('[check-email-confirmed] unexpected error', err);
    return NextResponse.json(
      {
        success: false,
        emailConfirmed: false,
        message: err?.message ?? 'Internal server error',
      },
      { status: 500 },
    );
  }
}

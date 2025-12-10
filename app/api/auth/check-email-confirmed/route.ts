// app/api/auth/check-email-confirmed/route.ts

import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { success: false, emailConfirmed: false, reason: 'unauthorized' },
      { status: 401 },
    );
  }

  const emailConfirmed = !!user.email_confirmed_at;

  // Синхронизация флага email_verified в profiles
  if (emailConfirmed) {
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,          // если у тебя колонка называется иначе (например, uid), поправь тут
          email_verified: true,
        },
        { onConflict: 'id' },
      );

    if (upsertError) {
      // Логируем, но не роняем ответ
      console.error(
        '[check-email-confirmed] Failed to sync email_verified to profiles',
        upsertError,
      );
    }
  }

  return NextResponse.json({
    success: true,
    emailConfirmed,
  });
}

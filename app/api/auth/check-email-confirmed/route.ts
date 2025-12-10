// app/api/auth/check-email-confirmed/route.ts

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Проверяет статус подтверждения email для текущего залогиненного пользователя
 * Возвращает emailConfirmed: true ТОЛЬКО если user.email_confirmed_at не NULL
 * Это означает, что пользователь реально перешёл по ссылке из письма
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { success: false, emailConfirmed: false, reason: 'unauthorized' },
        { status: 401 }
      );
    }

    // КРИТИЧНО: Проверяем ТОЛЬКО user.email_confirmed_at
    // Это поле устанавливается Supabase только после реального перехода по ссылке из письма
    const emailConfirmed = !!user.email_confirmed_at;

    // Дополнительно – синхронизируем profiles.email_verified ТОЛЬКО если email действительно подтверждён
    if (emailConfirmed) {
      const supabaseAdmin = createAdminSupabaseClient();
      await supabaseAdmin
        .from('profiles')
        .upsert(
          { id: user.id, email_verified: true, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        )
        .catch((err) => {
          // Логируем ошибку, но не блокируем ответ
          console.error("[check-email-confirmed] Failed to sync email_verified to profiles", err);
        });
    }

    return NextResponse.json({
      success: true,
      emailConfirmed,
    });
  } catch (err: any) {
    console.error("[check-email-confirmed] unexpected error", err);
    return NextResponse.json(
      {
        success: false,
        emailConfirmed: false,
        message: err?.message ?? "Internal server error",
      },
      { status: 500 }
    );
  }
}


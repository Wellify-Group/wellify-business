// app/api/auth/email-sync-profile/route.ts
// Синхронизирует профиль после подтверждения email
// ВАЖНО: email_verified ставится ТОЛЬКО если email_confirmed_at реально заполнен в Supabase Auth

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminSupabaseClient();

    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, message: 'userId and email are required' },
        { status: 400 }
      );
    }

    // КРИТИЧНО: Проверяем, что email реально подтвержден в Supabase Auth
    const { data: userData, error: getUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError) {
      console.error('[email-sync-profile] getUserById error:', getUserError.message);
      return NextResponse.json(
        { success: false, message: 'User not found in auth' },
        { status: 404 }
      );
    }

    const user = userData?.user;
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Проверяем email_confirmed_at (единственный надежный источник истины)
    const emailConfirmedAt = (user as any).email_confirmed_at;
    if (!emailConfirmedAt) {
      console.warn(
        '[email-sync-profile] Email not confirmed in auth',
        `userId=${userId}, email_confirmed_at is null`
      );
      return NextResponse.json(
        {
          success: false,
          error: 'email_not_confirmed',
          message:
            'Email must be confirmed in Supabase Auth before syncing profile',
        },
        { status: 409 }
      );
    }

    // Email подтвержден - можно обновлять профиль
    const normalizedEmail = email.toLowerCase().trim();

    // Проверяем, есть ли уже профиль
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      // Обновляем существующий профиль
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          email: normalizedEmail,
          email_verified: true, // Теперь безопасно ставить true, т.к. email_confirmed_at проверен
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[email-sync-profile] Error updating profile', updateError);
        return NextResponse.json(
          { success: false, message: 'Failed to update profile' },
          { status: 500 }
        );
      }
    } else {
      // Создаём новый профиль (если его еще нет)
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: normalizedEmail,
          email_verified: true, // Теперь безопасно ставить true, т.к. email_confirmed_at проверен
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('[email-sync-profile] Error creating profile', insertError);
        return NextResponse.json(
          { success: false, message: 'Failed to create profile' },
          { status: 500 }
        );
      }
    }

    console.log('[email-sync-profile] Success', {
      userId,
      email: `${normalizedEmail.substring(0, 3)}***@${normalizedEmail.split('@')[1] ?? '***'}`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[email-sync-profile] Unexpected error', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// app/api/auth/check-email-confirmed/route.ts
// Проверяет подтверждение email через getUserById (не listUsers)

import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// Принудительно динамический рендеринг
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
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
    const email = searchParams.get('email'); // Fallback для обратной совместимости

    // Приоритет: userId, если нет - email (для обратной совместимости)
    if (!userId && !email) {
      return NextResponse.json(
        { success: false, emailConfirmed: false, error: 'userId_or_email_required' },
        { status: 400 }
      );
    }

    let user = null;

    if (userId) {
      // Используем getUserById (предпочтительный метод)
      const { data: userData, error: getUserError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (getUserError) {
        console.error('[check-email-confirmed] getUserById error:', getUserError.message);
        return NextResponse.json(
          { success: false, emailConfirmed: false, error: 'user_not_found' },
          { status: 404 }
        );
      }

      user = userData?.user ?? null;
    } else if (email) {
      // Fallback: поиск по email через listUsers (для обратной совместимости)
      const normalizedEmail = email.trim().toLowerCase();
      const { data: usersData, error: listError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        console.error('[check-email-confirmed] listUsers error:', listError.message);
        return NextResponse.json(
          { success: false, emailConfirmed: false, error: 'admin_error' },
          { status: 500 }
        );
      }

      user =
        usersData?.users?.find(
          (u) => u.email && u.email.toLowerCase() === normalizedEmail
        ) ?? null;
    }

    // Пользователь не найден
    if (!user) {
      return NextResponse.json(
        { success: true, emailConfirmed: false },
        { status: 200 }
      );
    }

    // Реальное подтверждение e-mail в Supabase
    // email_confirmed_at заполняется ТОЛЬКО после клика по ссылке из письма
    // НЕ проверяем user_metadata.email_verified, так как оно может быть установлено вручную
    const emailConfirmed = Boolean((user as any).email_confirmed_at);

    // Безопасное логирование (без PII)
    const maskedEmail = user.email
      ? `${user.email.substring(0, 3)}***@${user.email.split('@')[1] ?? '***'}`
      : 'N/A';
    console.log('[check-email-confirmed] User check:', {
      userId: user.id,
      email: maskedEmail,
      email_confirmed_at: (user as any).email_confirmed_at ? 'SET' : 'NULL',
      emailConfirmed,
    });

    return NextResponse.json(
      { success: true, emailConfirmed },
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

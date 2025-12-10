// app/api/auth/check-email-confirmed/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Проверяет статус email_verified в таблице profiles
 * Возвращает emailConfirmed: true ТОЛЬКО если profiles.email_verified = TRUE
 * Мониторит изменения в этой ячейке каждую секунду
 * 
 * Поддерживает два режима:
 * 1. Если пользователь залогинен - проверяет по user.id из сессии
 * 2. Если пользователь не залогинен - проверяет по email из query параметра
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createAdminSupabaseClient();

    // Пытаемся получить пользователя из сессии
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    let userId: string | null = null;
    let userEmail: string | null = null;

    if (user && !userError) {
      // Пользователь залогинен - используем его ID
      userId = user.id;
      userEmail = user.email || null;
      console.log('[check-email-confirmed] User authenticated from session', { userId, userEmail });
    } else {
      // Пользователь не залогинен - пытаемся найти по email из query параметра
      const { searchParams } = new URL(request.url);
      const email = searchParams.get('email');
      
      if (email) {
        console.log('[check-email-confirmed] User not authenticated, searching by email', { email });
        
        // Ищем пользователя по email через admin API
        const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (!listError && usersList?.users) {
          const foundUser = usersList.users.find(
            (u) => u.email && u.email.toLowerCase().trim() === email.toLowerCase().trim()
          );
          
          if (foundUser) {
            userId = foundUser.id;
            userEmail = foundUser.email || null;
            console.log('[check-email-confirmed] User found by email', { userId, userEmail });
          } else {
            console.log('[check-email-confirmed] User not found by email', { email });
            return NextResponse.json({
              success: true,
              emailConfirmed: false,
              reason: 'user_not_found',
            });
          }
        } else {
          console.error('[check-email-confirmed] Error listing users', listError);
          return NextResponse.json({
            success: false,
            emailConfirmed: false,
            reason: 'failed_to_find_user',
          }, { status: 500 });
        }
      } else {
        // Нет ни сессии, ни email в query
        console.log('[check-email-confirmed] No session and no email parameter');
        return NextResponse.json({
          success: true,
          emailConfirmed: false,
          reason: 'no_user_identifier',
        });
      }
    }

    if (!userId) {
      return NextResponse.json({
        success: true,
        emailConfirmed: false,
        reason: 'no_user_id',
      });
    }

    // КРИТИЧНО: Проверяем ТОЛЬКО profiles.email_verified из базы данных через admin клиент
    // Это гарантирует, что мы можем прочитать данные даже если RLS блокирует доступ
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email_verified')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[check-email-confirmed] Error fetching profile', {
        error: profileError,
        userId,
        email: userEmail,
      });
      // Если профиль не найден, считаем email не подтверждённым
      return NextResponse.json({
        success: true,
        emailConfirmed: false,
        reason: 'profile_not_found',
      });
    }

    const emailConfirmed = profile?.email_verified === true;

    // Детальное логирование для отладки
    console.log('[check-email-confirmed] Profile check result', {
      userId,
      email: userEmail,
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

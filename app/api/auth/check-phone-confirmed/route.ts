// app/api/auth/check-phone-confirmed/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Проверяет статус phone_verified в таблице profiles
 * Возвращает phoneConfirmed: true ТОЛЬКО если profiles.phone_verified = TRUE
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
      console.log('[check-phone-confirmed] User authenticated from session', { userId, userEmail });
    } else {
      // Пользователь не залогинен - пытаемся найти по email из query параметра
      const { searchParams } = new URL(request.url);
      const email = searchParams.get('email');
      
      if (email) {
        console.log('[check-phone-confirmed] User not authenticated, searching by email', { email });
        
        // Ищем пользователя по email через admin API
        const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (!listError && usersList?.users) {
          const foundUser = usersList.users.find(
            (u) => u.email && u.email.toLowerCase().trim() === email.toLowerCase().trim()
          );
          
          if (foundUser) {
            userId = foundUser.id;
            userEmail = foundUser.email || null;
            console.log('[check-phone-confirmed] User found by email', { userId, userEmail });
          } else {
            console.log('[check-phone-confirmed] User not found by email', { email });
            return NextResponse.json({
              success: true,
              phoneConfirmed: false,
              reason: 'user_not_found',
            });
          }
        } else {
          console.error('[check-phone-confirmed] Error listing users', listError);
          return NextResponse.json({
            success: false,
            phoneConfirmed: false,
            reason: 'failed_to_find_user',
          }, { status: 500 });
        }
      } else {
        // Нет ни сессии, ни email в query
        console.log('[check-phone-confirmed] No session and no email parameter');
        return NextResponse.json({
          success: true,
          phoneConfirmed: false,
          reason: 'no_user_identifier',
        });
      }
    }

    if (!userId) {
      return NextResponse.json({
        success: true,
        phoneConfirmed: false,
        reason: 'no_user_id',
      });
    }

    // КРИТИЧНО: Проверяем ТОЛЬКО profiles.phone_verified из базы данных через admin клиент
    // Это гарантирует, что мы можем прочитать данные даже если RLS блокирует доступ
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('phone_verified, phone')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[check-phone-confirmed] Error fetching profile', {
        error: profileError,
        userId,
        email: userEmail,
      });
      // Если профиль не найден, считаем phone не подтверждённым
      return NextResponse.json({
        success: true,
        phoneConfirmed: false,
        reason: 'profile_not_found',
      });
    }

    const phoneConfirmed = profile?.phone_verified === true;

    // Детальное логирование для отладки
    console.log('[check-phone-confirmed] Profile check result', {
      userId,
      email: userEmail,
      phone_verified: profile?.phone_verified,
      phoneConfirmed,
    });

    return NextResponse.json({
      success: true,
      phoneConfirmed,
      phone: profile?.phone || null,
    });
  } catch (err: any) {
    console.error('[check-phone-confirmed] unexpected error', err);
    return NextResponse.json(
      {
        success: false,
        phoneConfirmed: false,
        message: err?.message ?? 'Internal server error',
      },
      { status: 500 },
    );
  }
}


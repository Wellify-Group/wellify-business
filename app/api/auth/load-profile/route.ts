// app/api/auth/load-profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/auth/load-profile
 * Загружает данные профиля пользователя из Supabase profiles таблицы
 * Используется для синхронизации данных после регистрации/входа
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createAdminSupabaseClient();

    // Получаем текущего пользователя из сессии
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated',
        },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Загружаем профиль из Supabase через admin клиент (обходит RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[load-profile] Error fetching profile', {
        error: profileError,
        userId,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Profile not found',
          details: profileError.message,
        },
        { status: 404 }
      );
    }

    // Формируем данные пользователя для фронтенда
    const userData = {
      id: userId,
      name: profile.first_name || user.email?.split('@')[0] || 'User',
      fullName: profile.full_name || null,
      email: profile.email || user.email || null,
      phone: profile.phone || null,
      dob: profile.birth_date || null,
      role: (profile.role || 'director') as 'director' | 'manager' | 'employee',
      businessId: profile.business_id || userId,
      companyCode: (profile as any)['код_компании'] || profile.company_code || null,
      // Дополнительные поля из профиля
      firstName: profile.first_name || null,
      lastName: profile.last_name || null,
      middleName: profile.middle_name || null,
    };

    console.log('[load-profile] Profile loaded successfully', {
      userId,
      hasFullName: !!userData.fullName,
      hasPhone: !!userData.phone,
      hasDob: !!userData.dob,
    });

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (err: any) {
    console.error('[load-profile] Unexpected error', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}


// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Функция для создания админ-клиента Supabase
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();

    // Для отладки - можно оставить
    console.log('LOGIN BODY:', body);

    // Фронт сейчас шлёт: { role, identifier, password }
    const { identifier, password } = body as {
      identifier?: string;
      password?: string;
      role?: string;
    };

    const email = identifier?.toLowerCase().trim();

    // Валидация входных данных
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing email or password' },
        { status: 400 }
      );
    }

    // === ЛОГИН В SUPABASE ===
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    // Обработка ошибок аутентификации
    if (error || !data.user) {
      console.error('supabase signIn error:', error);
      
      // Проверяем, что это ошибка неверных учетных данных
      if (error?.message?.toLowerCase().includes('invalid login credentials') ||
          error?.message?.toLowerCase().includes('invalid credentials') ||
          error?.message?.toLowerCase().includes('email not confirmed')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid email or password',
            errorCode: 'INVALID_CREDENTIALS'
          },
          { status: 401 }
        );
      }

      // Другие ошибки аутентификации
      return NextResponse.json(
        { 
          success: false, 
          error: 'Login failed',
          errorCode: 'LOGIN_UNKNOWN_ERROR'
        },
        { status: 500 }
      );
    }

    // === ПОДТЯГИВАЕМ ПРОФИЛЬ ИЗ ТАБЛИЦЫ profiles ===
    // Важно: русские имена колонок нужно брать в двойные кавычки
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, "ФИО", "имя", "роль", "бизнес_id"')
      .eq('id', data.user.id)
      .single();

    // Проверяем наличие профиля и обязательных полей
    if (profileError || !profile) {
      console.error('Load profile error:', profileError);
      // Выходим из сессии, если профиль не найден
      await supabaseAdmin.auth.signOut();
      return NextResponse.json(
        { 
          success: false, 
          error: 'User profile not found',
          errorCode: 'PROFILE_NOT_FOUND'
        },
        { status: 403 }
      );
    }

    // Проверяем, что профиль полный (есть роль и бизнес_id)
    const profileRecord = profile as Record<string, any>;
    const hasRole = profileRecord['роль'];
    const hasBusinessId = profileRecord['бизнес_id'];

    if (!hasRole || !hasBusinessId) {
      console.error('Incomplete profile: missing роль or бизнес_id');
      // Выходим из сессии, если профиль неполный
      await supabaseAdmin.auth.signOut();
      return NextResponse.json(
        { 
          success: false, 
          error: 'User profile incomplete',
          errorCode: 'PROFILE_NOT_FOUND'
        },
        { status: 403 }
      );
    }

    const userPayload = {
      id: data.user.id,
      email: data.user.email,
      fullName: profile?.['ФИО'] ?? null,
      shortName: profile?.['имя'] ?? null,
      role: profile?.['роль'] ?? 'директор',
    };

    return NextResponse.json(
      {
        success: true,
        user: userPayload,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Login handler error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

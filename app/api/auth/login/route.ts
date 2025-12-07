// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapProfileFromDb, isProfileComplete } from '@/lib/types/profile';

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

    // === Проверяем, существует ли пользователь с таким email ===
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (!userExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Пользователь с таким email не зарегистрирован.',
          errorCode: 'USER_NOT_FOUND'
        },
        { status: 404 }
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
      
      // Проверяем, что это ошибка неверного пароля
      if (error?.message?.toLowerCase().includes('invalid login credentials') ||
          error?.message?.toLowerCase().includes('invalid credentials')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Неверный пароль.',
            errorCode: 'INVALID_PASSWORD'
          },
          { status: 401 }
        );
      }

      // Email не подтвержден
      if (error?.message?.toLowerCase().includes('email not confirmed')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Email не подтвержден. Проверьте вашу почту.',
            errorCode: 'EMAIL_NOT_CONFIRMED'
          },
          { status: 403 }
        );
      }

      // Другие ошибки аутентификации
      return NextResponse.json(
        { 
          success: false, 
          error: 'Произошла ошибка при входе. Попробуйте позже.',
          errorCode: 'LOGIN_UNKNOWN_ERROR'
        },
        { status: 500 }
      );
    }

    // === ПОДТЯГИВАЕМ ПРОФИЛЬ ИЗ ТАБЛИЦЫ profiles ===
    const { data: profileRaw, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Проверяем наличие профиля
    if (profileError || !profileRaw) {
      console.error('Load profile error:', profileError);
      // Bug 4 Fix: Admin клиент не имеет сессий, поэтому signOut() не работает
      // Вместо этого просто возвращаем ошибку - сессия будет недействительной на клиенте
      // Клиент должен обработать эту ошибку и очистить локальную сессию
      return NextResponse.json(
        { 
          success: false, 
          error: 'Профиль пользователя не найден. Обратитесь в поддержку.',
          errorCode: 'PROFILE_NOT_FOUND'
        },
        { status: 403 }
      );
    }

    // Преобразуем профиль в типизированный формат
    const profile = mapProfileFromDb(profileRaw);

    // Проверяем, что профиль полный (есть роль и бизнес_id)
    if (!isProfileComplete(profile)) {
      console.error('Incomplete profile: missing role or businessId');
      // Не выходим из сессии, но перенаправляем на завершение профиля
      // Это обрабатывается на клиенте
      return NextResponse.json(
        { 
          success: false, 
          error: 'Профиль неполный. Требуется завершение регистрации.',
          errorCode: 'PROFILE_INCOMPLETE'
        },
        { status: 403 }
      );
    }

    const userPayload = {
      id: data.user.id,
      email: data.user.email,
      fullName: profile.fullName ?? null,
      shortName: profile.shortName ?? null,
      role: profile.role ?? 'директор',
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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapProfileToDb } from '@/lib/types/profile';

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
    const { email, password, fullName } = body;

    // === Валидация ===
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // === Проверяем, существует ли пользователь с таким email ===
    const normalizedEmail = email.toLowerCase().trim();
    
    // Проверяем через admin API, существует ли пользователь
    const { data: existingUsers, error: listError } = 
      await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error checking existing users:', listError);
    } else {
      const exists = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === normalizedEmail
      );
      
      if (exists) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User with this email already exists',
            errorCode: 'EMAIL_ALREADY_REGISTERED'
          },
          { status: 409 }
        );
      }
    }

    // === Генерируем код компании и ID бизнеса ===
    const generateCompanyCode = () => {
      const part = () => Math.floor(1000 + Math.random() * 9000);
      return `${part()}-${part()}-${part()}-${part()}`;
    };

    const companyCode = generateCompanyCode();
    const businessId = `biz-${Date.now()}`;

    // Короткое имя для профиля
    const shortName =
      fullName.trim().split(' ')[0] || fullName.trim() || 'Директор';

    // === Создаём пользователя в Supabase Auth через signUp ===
    const { data, error: signUpError } = await supabaseAdmin.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          fullName,
          role: 'директор',
          businessId,
          companyCode,
        },
      },
    });

    // Обработка ошибок регистрации
    if (signUpError) {
      console.error('Supabase signUp error:', signUpError);
      
      // Проверяем, что email уже зарегистрирован
      if (
        signUpError.message?.toLowerCase().includes('already registered') ||
        signUpError.message?.toLowerCase().includes('user already registered') ||
        signUpError.message?.toLowerCase().includes('already exists')
      ) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User with this email already exists',
            errorCode: 'EMAIL_ALREADY_REGISTERED'
          },
          { status: 409 }
        );
      }

      // Другие ошибки
      return NextResponse.json(
        { 
          success: false, 
          error: 'Registration failed',
          errorCode: 'REGISTER_UNKNOWN_ERROR'
        },
        { status: 500 }
      );
    }

    if (!data?.user) {
      console.error('No user returned from signUp');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Registration failed',
          errorCode: 'REGISTER_UNKNOWN_ERROR'
        },
        { status: 500 }
      );
    }

    const user = data.user;

    // === Обновляем профиль в public.profiles ===
    // Supabase автоматически создает профиль через триггер, поэтому используем только UPDATE
    // Используем типизированный маппинг для обновления профиля
    const profileData = mapProfileToDb({
      id: user.id,
      email: user.email,
      fullName: fullName,
      shortName: shortName,
      role: 'директор',
      businessId: businessId,
      companyCode: companyCode,
      jobTitle: 'владелец',
      active: true,
    });

    // Удаляем id из данных для UPDATE (id используется только в .eq())
    const { id, ...updateData } = profileData;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (profileError) {
      console.error('Supabase profile update error:', profileError);
      
      // Если профиль не обновился, удаляем пользователя из auth, чтобы избежать "висящих" аккаунтов
      try {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        console.log('Deleted user from auth due to profile update failure');
      } catch (deleteError) {
        console.error('Failed to delete user from auth:', deleteError);
      }
      
      // Проверяем, может ли это быть ошибка (профиль не найден)
      if (
        profileError.message?.toLowerCase().includes('not found') ||
        profileError.message?.toLowerCase().includes('no rows') ||
        profileError.code === 'PGRST116' // PostgREST no rows returned
      ) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User with this email already exists',
            errorCode: 'EMAIL_ALREADY_REGISTERED'
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Не удалось создать профиль пользователя. Попробуйте позже или обратитесь в поддержку.',
          errorCode: 'PROFILE_CREATION_FAILED',
          details: profileError.message
        },
        { status: 500 }
      );
    }

    // === Ответ клиенту ===
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName,
          role: 'director',
          businessId,
          companyCode,
        },
        companyCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

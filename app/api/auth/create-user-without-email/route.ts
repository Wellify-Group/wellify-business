import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Админ-клиент Supabase
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

/**
 * POST /api/auth/create-user-without-email
 * Создает пользователя через admin API без отправки письма подтверждения
 * 
 * Body: { email, password, first_name, last_name, middle_name, full_name, birth_date, locale }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      first_name,
      last_name,
      middle_name,
      full_name,
      birth_date,
      locale,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Проверяем, существует ли пользователь
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { success: false, error: 'Failed to check existing users' },
        { status: 500 }
      );
    }

    const existingUser = existingUsers.users.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User already registered',
          user: existingUser 
        },
        { status: 400 }
      );
    }

    // Создаем пользователя через admin API (без отправки письма)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: false, // Email не подтвержден, подтвердим через наш код
      user_metadata: {
        first_name: first_name || null,
        last_name: last_name || null,
        middle_name: middle_name || null,
        full_name: full_name || null,
        birth_date: birth_date || null,
        locale: locale || 'ru',
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      
      // Проверка на существующий email
      const msg = createError.message?.toLowerCase() || '';
      if (
        msg.includes('already') ||
        msg.includes('exists') ||
        msg.includes('registered') ||
        msg.includes('user already registered') ||
        msg.includes('email already exists')
      ) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User already registered',
            user: null 
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: createError.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: newUser.user,
    });
  } catch (error: any) {
    console.error('Create user without email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


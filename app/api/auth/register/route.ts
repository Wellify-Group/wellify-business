import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Supabase Admin client (server-side, с service role ключом)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    // === Валидация ===
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // === Проверяем, что пользователь с такой почтой уже есть ===
    const { data: existingUsers, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Supabase listUsers error:', listError);
      return NextResponse.json(
        { success: false, error: 'Internal auth error' },
        { status: 500 }
      );
    }

    const exists = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (exists) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
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

    // === Создаём пользователя в Supabase Auth ===
    const { data, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        email_confirm: true,
        user_metadata: {
          fullName,
          role: 'директор',
          businessId,
          companyCode,
        },
      });

    if (createError || !data?.user) {
      console.error('Supabase createUser error:', createError);
      return NextResponse.json(
        { success: false, error: 'Registration failed' },
        { status: 500 }
      );
    }

    const user = data.user;

    // === Создаём профиль в public.profiles ===
    const profileData: any = {
      id: user.id,                 // обязательно = auth.users.id
      email: user.email,
      ['ФИО']: fullName,
      ['имя']: shortName,
      роль: 'директор',
      бизнес_id: businessId,
      код_компании: companyCode,
      должность: 'владелец',
      активен: true,
      // остальные поля (телефон, страна и т.п.) пока null
    };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      console.error('Supabase profile insert error:', profileError);
      return NextResponse.json(
        { success: false, error: 'Failed to create user profile' },
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

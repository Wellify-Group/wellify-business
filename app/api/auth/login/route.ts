// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Админ-клиент Supabase для серверных операций
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // важно: service role, только на сервере
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

    if (error || !data.user) {
      console.error('supabase signIn error:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // === ПОДТЯГИВАЕМ ПРОФИЛЬ ИЗ ТАБЛИЦЫ profiles ===
    // Важно: русские имена колонок нужно брать в двойные кавычки
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, "ФИО", "имя", "роль"')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Load profile error:', profileError);
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

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
 * POST /api/auth/verify-password-reset-code
 * Проверяет код восстановления пароля
 * 
 * Body: { email: string, code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Валидация кода (6 цифр)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Invalid code format. Code must be 6 digits' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Ищем код в БД
    const { data: verification, error: findError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('token', code)
      .is('verified_at', null) // Еще не подтвержден
      .gt('expires_at', new Date().toISOString()) // Не истек
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !verification) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    // Проверяем, что код не истек
    const expiresAt = new Date(verification.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Code has expired' },
        { status: 400 }
      );
    }

    // Отмечаем код как использованный
    await supabaseAdmin
      .from('email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id);

    return NextResponse.json({
      success: true,
      message: 'Code verified successfully',
      userId: verification.user_id,
    });
  } catch (error: any) {
    console.error('Verify password reset code error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


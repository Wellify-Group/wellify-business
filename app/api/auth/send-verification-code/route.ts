import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MailerService } from '@/lib/application/report/MailerService';

export const runtime = 'nodejs';

// Генерация 6-значного кода
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
 * POST /api/auth/send-verification-code
 * Отправляет код подтверждения на email
 * 
 * Body: { email: string, userId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
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

    const supabaseAdmin = getSupabaseAdmin();
    const mailerService = new MailerService();

    // Если userId не передан, ищем пользователя по email
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      if (userError) {
        console.error('Error fetching users:', userError);
        return NextResponse.json(
          { success: false, error: 'Failed to find user' },
          { status: 500 }
        );
      }

      const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      targetUserId = user.id;
    }

    // Генерируем код
    const code = generateVerificationCode();

    // Удаляем старые коды для этого пользователя
    await supabaseAdmin
      .from('email_verifications')
      .delete()
      .eq('user_id', targetUserId)
      .eq('email', email.toLowerCase());

    // Сохраняем новый код в БД (код хранится в поле token)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Код действителен 15 минут

    const { error: insertError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        user_id: targetUserId,
        email: email.toLowerCase(),
        token: code, // Используем поле token для хранения кода
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error saving verification code:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save verification code' },
        { status: 500 }
      );
    }

    // Отправляем код на email
    try {
      await mailerService.sendVerificationCode(email, code);
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send email: ' + emailError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to email',
    });
  } catch (error: any) {
    console.error('Send verification code error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


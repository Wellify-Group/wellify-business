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
 * POST /api/auth/forgot-password
 * Отправляет код подтверждения для восстановления пароля
 * 
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

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

    // Проверяем наличие Resend API ключа
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email service is not configured. Please contact support.' 
        },
        { status: 500 }
      );
    }

    // Ищем пользователя по email
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
        { 
          success: false, 
          error: 'EMAIL_NOT_FOUND',
          message: 'No account found with this email address.'
        },
        { status: 404 }
      );
    }

    // Генерируем код
    let code = generateVerificationCode();
    let attempts = 0;
    const maxAttempts = 5;

    // Удаляем старые коды для этого пользователя
    await supabaseAdmin
      .from('email_verifications')
      .delete()
      .eq('user_id', user.id)
      .eq('email', email.toLowerCase());

    // Сохраняем новый код в БД
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Код действителен 15 минут

    let insertError;
    
    // Пытаемся вставить код, если уникальность нарушена - генерируем новый
    do {
      const { error } = await supabaseAdmin
        .from('email_verifications')
        .insert({
          user_id: user.id,
          email: email.toLowerCase(),
          token: code,
          expires_at: expiresAt.toISOString(),
        })
        .select();

      insertError = error;

      // Если ошибка уникальности - генерируем новый код
      if (insertError && insertError.code === '23505' && attempts < maxAttempts) {
        code = generateVerificationCode();
        attempts++;
        console.log(`Code collision detected, generating new code (attempt ${attempts})`);
      } else {
        break;
      }
    } while (attempts < maxAttempts);

    if (insertError) {
      console.error('Error saving verification code:', {
        error: insertError,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        userId: user.id,
        email: email.toLowerCase(),
      });
      
      let errorMessage = 'Failed to save verification code';
      if (insertError.code === '42P01') {
        errorMessage = 'Database table email_verifications does not exist. Please run migration.';
      } else if (insertError.code === '23505') {
        errorMessage = 'Verification code already exists. Please try again.';
      } else if (insertError.message) {
        errorMessage = `Database error: ${insertError.message}`;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? insertError : undefined
        },
        { status: 500 }
      );
    }

    // Отправляем код на email
    try {
      await mailerService.sendPasswordResetCode(email, code);
      console.log('Password reset code email sent successfully to:', email);
    } catch (emailError: any) {
      console.error('Error sending email via Resend:', {
        error: emailError,
        message: emailError.message,
        email: email,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send email. Please check your Resend API configuration.',
          details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a code has been sent.',
    });
  } catch (error: any) {
    console.error('Send password reset code error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

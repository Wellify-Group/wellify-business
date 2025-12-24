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
    
    // Проверяем наличие Resend API ключа
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email service is not configured',
          errorCode: 'EMAIL_SERVICE_NOT_CONFIGURED'
        },
        { status: 500 }
      );
    }
    
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

    // Удаляем старые коды для этого пользователя
    await supabaseAdmin
      .from('email_verifications')
      .delete()
      .eq('user_id', targetUserId)
      .eq('email', email.toLowerCase());

    // Генерируем код (после удаления старых, чтобы избежать конфликтов)
    let code = generateVerificationCode();
    let attempts = 0;
    const maxAttempts = 5;

    // Сохраняем новый код в БД (код хранится в поле token)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Код действителен 15 минут

    let insertData;
    let insertError;
    
    // Пытаемся вставить код, если уникальность нарушена - генерируем новый
    do {
      const { data, error } = await supabaseAdmin
        .from('email_verifications')
        .insert({
          user_id: targetUserId,
          email: email.toLowerCase(),
          token: code, // Используем поле token для хранения кода
          expires_at: expiresAt.toISOString(),
        })
        .select();

      insertData = data;
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
        userId: targetUserId,
        email: email.toLowerCase(),
      });
      
      // Более детальное сообщение об ошибке
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

    // Получаем язык пользователя из профиля или используем 'uk' по умолчанию
    let userLanguage: 'ru' | 'uk' | 'en' = 'uk';
    if (targetUserId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('language')
        .eq('id', targetUserId)
        .maybeSingle();
      
      if (profile?.language) {
        const lang = profile.language === 'ua' ? 'uk' : (profile.language as 'ru' | 'uk' | 'en');
        if (['ru', 'uk', 'en'].includes(lang)) {
          userLanguage = lang;
        }
      } else {
        // Пробуем получить из user_metadata
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
        if (user?.user?.user_metadata?.locale) {
          const locale = user.user.user_metadata.locale;
          const lang = locale === 'ua' ? 'uk' : (locale === 'uk' ? 'uk' : (locale === 'en' ? 'en' : 'ru'));
          if (['ru', 'uk', 'en'].includes(lang)) {
            userLanguage = lang;
          }
        }
      }
    }

    // Отправляем код на email
    try {
      await mailerService.sendVerificationCode(email, code, userLanguage);
      console.log('Verification code email sent successfully to:', email);
    } catch (emailError: any) {
      console.error('Error sending email via Resend:', {
        error: emailError,
        message: emailError.message,
        email: email,
      });
      
      // Если код уже сохранен в БД, но email не отправился - это не критично
      // Пользователь может запросить новый код
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send email',
          errorCode: 'EMAIL_SEND_FAILED',
          details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        },
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


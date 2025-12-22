// app/api/auth/send-custom-email-confirmation/route.ts
// НОВАЯ ТАКТИКА: Генерируем кастомный токен, сохраняем в БД и отправляем письмо через Resend

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Генерируем безопасный токен
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Получаем базовый URL для ссылок подтверждения
function getAuthServiceUrl(): string {
  return process.env.APP_BASE_URL || 
         process.env.NEXT_PUBLIC_APP_URL || 
         (process.env.NODE_ENV === 'production' 
           ? 'https://business.wellifyglobal.com'
           : 'https://dev.wellifyglobal.com');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, firstName, lastName } = body;

    console.log('[send-custom-email-confirmation] Request received:', { userId, email: email ? `${email.substring(0, 10)}...` : null });

    if (!userId || !email) {
      console.error('[send-custom-email-confirmation] Missing required fields:', { userId: !!userId, email: !!email });
      return NextResponse.json(
        { success: false, error: 'userId and email are required' },
        { status: 400 }
      );
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = createAdminSupabaseClient();
      console.log('[send-custom-email-confirmation] Supabase admin client created');
    } catch (supabaseError: any) {
      console.error('[send-custom-email-confirmation] Failed to create Supabase admin client:', supabaseError?.message);
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Генерируем уникальный токен
    const token = generateSecureToken();
    console.log('[send-custom-email-confirmation] Token generated');
    
    // Хешируем токен для безопасного хранения в БД
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    console.log('[send-custom-email-confirmation] Token hashed');
    
    // Сохраняем хеш токена в БД (используем существующую структуру таблицы)
    // user_id может быть NULL, если колонка не обязательна
    const insertData: any = {
      email: email.toLowerCase().trim(),
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 часа
    };
    
    // Добавляем user_id только если он передан (колонка может быть опциональной)
    if (userId) {
      insertData.user_id = userId;
    }
    
    console.log('[send-custom-email-confirmation] Inserting into email_verifications:', { email: insertData.email, hasUserId: !!insertData.user_id });
    
    const { error: insertError } = await supabaseAdmin
      .from('email_verifications')
      .insert(insertData);

    if (insertError) {
      console.error('[send-custom-email-confirmation] Error inserting token:', insertError);
      console.error('[send-custom-email-confirmation] Insert data:', insertData);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create verification token',
          details: insertError.message 
        },
        { status: 500 }
      );
    }
    
    console.log('[send-custom-email-confirmation] Token saved to database');

    // Формируем ссылку подтверждения
    const authServiceUrl = getAuthServiceUrl();
    const confirmationLink = `${authServiceUrl}/api/auth/confirm-email?token=${token}`;

    // Отправляем письмо через Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[send-custom-email-confirmation] RESEND_API_KEY is not set');
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const emailFrom = process.env.EMAIL_FROM || 'wellifybusiness@wellifyglobal.com';
    const userName = firstName && lastName ? `${firstName} ${lastName}` : email.split('@')[0];

    // HTML шаблон письма
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Подтверждение email - WELLIFY business</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">WELLIFY business</h1>
        </div>
        <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Подтвердите ваш email</h2>
          <p style="color: #4b5563; font-size: 16px;">Здравствуйте${userName ? `, ${firstName}` : ''}!</p>
          <p style="color: #4b5563; font-size: 16px;">Для завершения регистрации в WELLIFY business, пожалуйста, подтвердите ваш email адрес, нажав на кнопку ниже:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationLink}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Подтвердить email</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Или скопируйте и вставьте эту ссылку в браузер:</p>
          <p style="color: #667eea; font-size: 12px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">${confirmationLink}</p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">Эта ссылка действительна в течение 24 часов.</p>
          <p style="color: #9ca3af; font-size: 12px;">Если вы не регистрировались в WELLIFY business, просто проигнорируйте это письмо.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} WELLIFY business. Все права защищены.</p>
        </div>
      </body>
      </html>
    `;

    // Отправляем через Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: email.toLowerCase().trim(),
        subject: 'Подтвердите ваш email - WELLIFY business',
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('[send-custom-email-confirmation] Resend API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('[send-custom-email-confirmation] ✅ Email sent successfully to:', email);
    
    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent',
    });

  } catch (err: any) {
    console.error('[send-custom-email-confirmation] Unexpected error:', err);
    console.error('[send-custom-email-confirmation] Error stack:', err?.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: err?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}


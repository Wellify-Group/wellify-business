import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Backend API URL
const API_URL = process.env.RENDER_API_URL || process.env.NEXT_PUBLIC_API_URL || '';

if (!API_URL) {
  console.warn('RENDER_API_URL is not set. Email verification will fail.');
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

    if (!API_URL) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Backend API is not configured',
          errorCode: 'API_NOT_CONFIGURED'
        },
        { status: 500 }
      );
    }

    // Определяем язык пользователя (по умолчанию uk)
    let userLanguage: 'ru' | 'uk' | 'en' = 'uk';
    // TODO: Получить язык из профиля пользователя через backend API

    // Отправляем запрос в backend
    try {
      const response = await fetch(`${API_URL}/api/email-verification/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId, language: userLanguage }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: data.error || 'Failed to send verification code',
            errorCode: data.errorCode || 'EMAIL_SEND_FAILED',
          },
          { status: response.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to email',
      });
    } catch (fetchError: any) {
      console.error('Backend API error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to connect to backend server',
          errorCode: 'API_CONNECTION_ERROR',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Send verification code error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

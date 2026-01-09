import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export const runtime = 'nodejs';

if (!API_URL) {
  console.warn('RENDER_API_URL is not set. Email verification will fail.');
}

/**
 * POST /api/auth/verify-email-code
 * Проверяет код подтверждения и подтверждает email
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

    // Отправляем запрос в backend
    try {
      const response = await fetch(`${API_URL}/api/email-verification/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: data.error || 'Invalid or expired code',
            errorCode: data.errorCode || 'VERIFICATION_FAILED',
          },
          { status: response.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Email confirmed successfully',
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
    console.error('Verify email code error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

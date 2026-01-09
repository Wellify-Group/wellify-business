import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export const runtime = 'nodejs';

/**
 * POST /api/auth/create-user-without-email
 * Проксирует запрос на backend для создания пользователя без отправки письма
 * 
 * Body: { email, password, first_name, last_name, middle_name, full_name, birth_date, locale }
 */
export async function POST(request: NextRequest) {
  try {
    if (!API_URL) {
      return NextResponse.json(
        { success: false, error: 'Backend API is not configured' },
        { status: 500 }
      );
    }

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

    // Проксируем на backend
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        password,
        first_name,
        last_name,
        middle_name,
        full_name,
        birth_date,
        locale: locale || 'ru',
        skip_email_verification: true, // Не отправляем письмо сразу
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Проверка на существующий email
      if (response.status === 400 && data.error?.toLowerCase().includes('already')) {
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
        { success: false, error: data.error || 'Failed to create user' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error: any) {
    console.error('Create user without email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


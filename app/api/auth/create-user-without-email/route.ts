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
    console.log('[create-user-without-email] Request received');
    
    if (!API_URL) {
      console.error('[create-user-without-email] API_URL is not configured');
      return NextResponse.json(
        { success: false, error: 'Backend API is not configured' },
        { status: 500 }
      );
    }

    console.log('[create-user-without-email] API_URL:', API_URL);

    const body = await request.json();
    console.log('[create-user-without-email] Request body:', { 
      email: body.email, 
      hasPassword: !!body.password,
      firstName: body.first_name,
      lastName: body.last_name 
    });
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

    // Проксируем на backend register-director endpoint
    const backendUrl = `${API_URL}/api/auth/register-director`;
    console.log('[create-user-without-email] Calling backend:', backendUrl);
    
    let response;
    try {
      response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          firstName: first_name,
          lastName: last_name,
          middleName: middle_name,
          fullName: full_name,
          birthDate: birth_date,
          language: locale || 'ru',
        }),
      });
      
      console.log('[create-user-without-email] Backend response status:', response.status);
      console.log('[create-user-without-email] Backend response ok:', response.ok);
    } catch (fetchError: any) {
      console.error('[create-user-without-email] Failed to connect to backend:', fetchError);
      console.error('[create-user-without-email] Error details:', {
        message: fetchError.message,
        cause: fetchError.cause,
        stack: fetchError.stack
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Backend service unavailable. Please try again later.',
          errorCode: 'BACKEND_UNAVAILABLE'
        },
        { status: 503 }
      );
    }

    // Безопасно парсим ответ
    let data;
    try {
      const responseText = await response.text();
      console.log('[create-user-without-email] Backend response text length:', responseText.length);
      console.log('[create-user-without-email] Backend response text preview:', responseText.substring(0, 200));
      
      if (!responseText) {
        throw new Error('Empty response from backend');
      }
      data = JSON.parse(responseText);
      console.log('[create-user-without-email] Parsed response data:', { 
        success: data.success, 
        hasUser: !!data.user,
        error: data.error,
        errorCode: data.errorCode 
      });
    } catch (parseError: any) {
      console.error('[create-user-without-email] Failed to parse backend response:', parseError);
      console.error('[create-user-without-email] Response status:', response.status);
      console.error('[create-user-without-email] Response statusText:', response.statusText);
      console.error('[create-user-without-email] Response headers:', Object.fromEntries(response.headers.entries()));
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid response from backend server',
          errorCode: 'INVALID_RESPONSE'
        },
        { status: 500 }
      );
    }

    if (!response.ok || !data.success) {
      // Проверка на существующий email
      if (response.status === 409 || data.errorCode === 'EMAIL_ALREADY_REGISTERED' || 
          (response.status === 400 && data.error?.toLowerCase().includes('already'))) {
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
        { success: false, error: data.error || 'Failed to create user', errorCode: data.errorCode },
        { status: response.status }
      );
    }

    // Backend register-director возвращает { success: true, user: {...}, business: {...}, token }
    return NextResponse.json({
      success: true,
      user: data.user,
      token: data.token, // Токен тоже возвращаем на случай если нужен
    });
  } catch (error: any) {
    console.error('Create user without email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


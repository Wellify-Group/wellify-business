// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mapProfileFromDb, isProfileComplete } from '@/lib/types/profile';

export const runtime = 'nodejs';

// Backend API URL
const API_URL = process.env.RENDER_API_URL || process.env.NEXT_PUBLIC_API_URL || '';

if (!API_URL) {
  console.warn('RENDER_API_URL is not set. Login will fail.');
}

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

    if (!API_URL) {
      return NextResponse.json(
        { success: false, error: 'Backend API is not configured', errorCode: 'API_NOT_CONFIGURED' },
        { status: 500 }
      );
    }

    // === ЛОГИН ЧЕРЕЗ BACKEND API ===
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Обработка ошибок от backend
        if (response.status === 401) {
          return NextResponse.json(
            { 
              success: false, 
              error: data.error || 'Неверный пароль.',
              errorCode: 'INVALID_PASSWORD'
            },
            { status: 401 }
          );
        }

        if (response.status === 404) {
          return NextResponse.json(
            { 
              success: false, 
              error: data.error || 'Пользователь с таким email не зарегистрирован.',
              errorCode: 'USER_NOT_FOUND'
            },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { 
            success: false, 
            error: data.error || 'Произошла ошибка при входе.',
            errorCode: 'LOGIN_ERROR'
          },
          { status: response.status }
        );
      }

      // Успешный логин - получаем профиль
      const user = data.user;
      
      // TODO: Получить профиль из backend API
      // Пока возвращаем базовую информацию
      const userPayload = {
        id: user.id,
        email: user.email,
        fullName: user.full_name || null,
        shortName: user.full_name?.split(' ')[0] || null,
        role: 'director', // TODO: получить из профиля
      };

      return NextResponse.json(
        {
          success: true,
          user: userPayload,
          token: data.token, // Передаём токен клиенту
        },
        { status: 200 }
      );
    } catch (fetchError: any) {
      console.error('Backend API error:', fetchError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Не удалось подключиться к серверу. Попробуйте позже.',
          errorCode: 'API_CONNECTION_ERROR'
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('Login handler error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// app/api/auth/load-profile/route.ts
// Проксирует запрос на backend API

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/auth/load-profile
 * Загружает данные профиля пользователя из backend
 * Используется для синхронизации данных после регистрации/входа
 */
export async function GET(request: NextRequest) {
  try {
    if (!API_URL) {
      return NextResponse.json(
        {
          success: false,
          error: 'Backend API URL is not configured',
        },
        { status: 500 }
      );
    }

    // Получаем токен из заголовков или cookies
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated',
        },
        { status: 401 }
      );
    }

    // Получаем профиль через backend API
    const profileResponse = await fetch(`${API_URL}/api/profiles/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (profileResponse.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated',
        },
        { status: 401 }
      );
    }

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || 'Profile not found',
        },
        { status: profileResponse.status }
      );
    }

    const { profile } = await profileResponse.json();

    // Также получаем бизнес пользователя
    let business = null;
    try {
      const businessResponse = await fetch(`${API_URL}/api/businesses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (businessResponse.ok) {
        const { businesses } = await businessResponse.json();
        business = businesses?.[0] || null;
      }
    } catch (e) {
      console.warn('[load-profile] Failed to fetch business', e);
    }

    // Формируем данные пользователя для фронтенда
    const userData = {
      id: profile.id,
      name: profile.full_name?.split(' ')[0] || profile.email?.split('@')[0] || 'User',
      fullName: profile.full_name || null,
      email: profile.email || null,
      phone: profile.phone || null,
      dob: null, // birth_date будет добавлен позже если нужно
      role: (profile.role || 'director') as 'director' | 'manager' | 'employee',
      businessId: business?.id || profile.id,
      companyCode: business?.companyCode || null,
      // Дополнительные поля из профиля
      firstName: profile.full_name?.split(' ')[0] || null,
      lastName: profile.full_name?.split(' ').slice(1).join(' ') || null,
      middleName: null,
      // Поля для проверки верификации Telegram
      telegram_verified: false, // Будет добавлено позже
      phone_verified: profile.phone_verified || false,
    };

    console.log('[load-profile] Profile loaded successfully', {
      userId: profile.id,
      hasFullName: !!userData.fullName,
      hasPhone: !!userData.phone,
    });

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (err: any) {
    console.error('[load-profile] Unexpected error', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}


// app/api/auth/check-email-exists/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Проверяет, существует ли email в базе данных (auth.users)
 * Используется перед регистрацией, чтобы предложить пользователю войти вместо регистрации
 * 
 * Возвращает:
 * - exists: true - если email уже зарегистрирован
 * - exists: false - если email свободен для регистрации
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { 
          success: false, 
          exists: false, 
          message: "Email is required" 
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const normalizedEmail = email.trim().toLowerCase();

    // Проверяем все email в auth.users через admin API
    // Проходимся по всем пользователям и анализируем их email
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('[check-email-exists] Error listing users', listError);
      return NextResponse.json(
        {
          success: false,
          exists: false,
          message: "Failed to check email existence",
        },
        { status: 500 }
      );
    }

    // Ищем пользователя с таким email (регистронезависимый поиск)
    const existingUser = usersList?.users?.find(
      (u) => u.email && u.email.toLowerCase().trim() === normalizedEmail
    );

    if (existingUser) {
      console.log('[check-email-exists] Email already exists', {
        email: normalizedEmail,
        userId: existingUser.id,
      });
      
      return NextResponse.json({
        success: true,
        exists: true,
        message: "Email already registered",
      });
    }

    // Email не найден - можно регистрироваться
    console.log('[check-email-exists] Email is available', {
      email: normalizedEmail,
    });

    return NextResponse.json({
      success: true,
      exists: false,
      message: "Email is available",
    });
  } catch (err: any) {
    console.error('[check-email-exists] unexpected error', err);
    return NextResponse.json(
      {
        success: false,
        exists: false,
        message: err?.message ?? 'Internal server error',
      },
      { status: 500 }
    );
  }
}


// app/api/auth/check-phone/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Проверяет статус phone_verified в таблице profiles
 * Возвращает verified: true ТОЛЬКО если profiles.phone_verified = TRUE
 * Мониторит изменения в этой ячейке каждую секунду
 * 
 * Поддерживает два режима:
 * 1. Если пользователь залогинен - проверяет по user.id из сессии
 * 2. Если пользователь не залогинен - ищет пользователя по email из body
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, email } = await req.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { verified: false, message: "Phone is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const normalizedPhone = phone.trim();

    let userId: string | null = null;
    let userEmail: string | null = null;

    // Пытаемся получить пользователя из сессии
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (user && !userError) {
        // Пользователь залогинен - используем его ID
        userId = user.id;
        userEmail = user.email || null;
        console.log('[check-phone] User authenticated from session', { userId, userEmail });
      }
    } catch (sessionError) {
      console.log('[check-phone] Could not get user from session', sessionError);
    }

    // Если пользователь не залогинен, ищем по email (если передан)
    if (!userId && email) {
      console.log('[check-phone] User not authenticated, searching by email', { email });
      
      const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (!listError && usersList?.users) {
        const foundUser = usersList.users.find(
          (u) => u.email && u.email.toLowerCase().trim() === email.toLowerCase().trim()
        );
        
        if (foundUser) {
          userId = foundUser.id;
          userEmail = foundUser.email || null;
          console.log('[check-phone] User found by email', { userId, userEmail });
        } else {
          console.log('[check-phone] User not found by email', { email });
          return NextResponse.json({
            verified: false,
            reason: 'user_not_found',
          });
        }
      } else {
        console.error('[check-phone] Error listing users', listError);
        return NextResponse.json({
          verified: false,
          reason: 'failed_to_find_user',
        }, { status: 500 });
      }
    }

    if (!userId) {
      // Если нет ни сессии, ни email - ищем по телефону в profiles (fallback)
      console.log('[check-phone] No userId, searching by phone in profiles');
      const { data: profileByPhone, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, phone_verified")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (profileByPhone && !profileError) {
        const isPhoneVerified = profileByPhone.phone_verified === true;
        console.log('[check-phone] Profile found by phone', {
          userId: profileByPhone.id,
          phone_verified: profileByPhone.phone_verified,
          verified: isPhoneVerified,
        });
        return NextResponse.json({
          verified: isPhoneVerified,
          userId: profileByPhone.id,
        });
      }

      return NextResponse.json({
        verified: false,
        reason: 'no_user_id',
      });
    }

    // КРИТИЧНО: Проверяем ТОЛЬКО profiles.phone_verified из базы данных через admin клиент
    // Это гарантирует, что мы можем прочитать данные даже если RLS блокирует доступ
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("phone_verified, phone")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error('[check-phone] Error fetching profile', {
        error: profileError,
        userId,
        email: userEmail,
      });
      // Если профиль не найден, считаем телефон не подтверждённым
      return NextResponse.json({
        verified: false,
        reason: 'profile_not_found',
      });
    }

    const isPhoneVerified = profile?.phone_verified === true;

    // Дополнительная проверка: телефон в профиле должен совпадать с запрошенным
    if (isPhoneVerified && profile.phone && profile.phone.trim() !== normalizedPhone) {
      console.warn('[check-phone] Phone mismatch', {
        profilePhone: profile.phone,
        requestedPhone: normalizedPhone,
      });
      // Телефон в профиле не совпадает с запрошенным - считаем не подтверждённым
      return NextResponse.json({
        verified: false,
        reason: 'phone_mismatch',
      });
    }

    // Детальное логирование для отладки
    console.log('[check-phone] Profile check result', {
      userId,
      email: userEmail,
      phone: normalizedPhone,
      phone_verified: profile?.phone_verified,
      verified: isPhoneVerified,
    });

    return NextResponse.json({
      verified: isPhoneVerified,
      userId,
    });
  } catch (err: any) {
    console.error('[check-phone] unexpected error', err);
    return NextResponse.json(
      {
        verified: false,
        message: err?.message ?? "Internal server error",
      },
      { status: 500 }
    );
  }
}


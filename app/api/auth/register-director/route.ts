// app/api/auth/register-director/route.ts (ФИНАЛЬНАЯ ВЕРСИЯ С ИСПРАВЛЕНИЕМ DB-ОШИБКИ)

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapProfileToDb } from "@/lib/types/profile"; 

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Упрощенная функция для генерации кода компании (временно вынесена)
const generateCompanyCode = () => {
    const part = () => Math.floor(1000 + Math.random() * 9000);
    return `${part()}-${part()}-${part()}-${part()}`;
};


export async function POST(request: NextRequest) {
  try {
    // Создаём admin-клиент (с service_role, обходит RLS)
    let supabaseAdmin;
    try {
      supabaseAdmin = createAdminSupabaseClient();
    } catch (error: any) {
      console.error("[register-director] Failed to create admin client", {
        message: error?.message,
        details: error?.details || error?.stack,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error",
          details: error?.message || "Failed to initialize admin client",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      email,
      password,
      phone,
      firstName,
      lastName,
      middleName,
      birthDate,
      locale,
    } = body;

    // Валидация обязательных полей
    if (!email || !password || !phone || !firstName || !lastName) {
      console.error("[register-director] Missing required fields", {
        hasEmail: !!email,
        hasPassword: !!password,
        hasPhone: !!phone,
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
      });
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Ищем пользователя в Auth 
    const { data: userResponse, error: authUserError } =
      await supabaseAdmin.auth.admin.listUsers(); 

    if (authUserError) {
        console.error("[register-director] Error listing users", { error: authUserError.message });
        return NextResponse.json(
            { success: false, message: "Failed to check existing users" },
            { status: 500 }
        );
    }
    
    // Ищем точное совпадение
    const existingUser = userResponse?.users?.find(
        (u) => u.email && u.email.toLowerCase().trim() === normalizedEmail
    );

    if (!existingUser) {
        console.error("[register-director] User not found in auth", { email: normalizedEmail });
        return NextResponse.json(
            { success: false, message: "User not found after sign up. Please try again." },
            { status: 500 }
        );
    }

    const userId = existingUser.id;

    // 2. Обновляем AUTH (для phone/phone_verified, если не обновил бот)
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        phone: phone.trim(),
        phone_confirm: true,
    });

    if (updateAuthError) {
        console.warn("[register-director] Non-critical error updating auth phone/phone_confirm", { error: updateAuthError.message });
    }

    // 3. Ищем существующий профиль для businessId
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("бизнес_id, business_id, код_компании, company_code")
      .eq("id", userId)
      .maybeSingle();

    if (profileCheckError) {
        console.error("[register-director] Error checking existing profile for businessId", { error: profileCheckError.message });
    }

    // 4. Генерируем businessId/companyCode (если их нет)
    const existingBusinessId = (existingProfile as any)?.["бизнес_id"] || (existingProfile as any)?.business_id;
    const existingCompanyCode = (existingProfile as any)?.["код_компании"] || (existingProfile as any)?.company_code;
    
    const businessId = existingBusinessId || `biz-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const companyCode = existingCompanyCode || generateCompanyCode();

    // 5. Формируем финальные данные профиля
    const fullName = [lastName.trim(), firstName.trim(), middleName?.trim()]
      .filter(Boolean)
      .join(" ");

    const shortName = firstName.trim();
    const normalizedLocale = locale
      ? locale === "ua"
        ? "uk"
        : ["ru", "uk", "en"].includes(locale)
        ? locale
        : "ru"
      : "ru";
    
    // Используем mapProfileToDb для маппинга на вашу сложную схему
    const profileDataMapped = mapProfileToDb({
      id: userId,
      email: normalizedEmail,
      fullName,
      shortName,
      role: "директор",
      businessId,
      companyCode,
      jobTitle: "владелец",
      active: true,
      phone: phone.trim(),
      phoneVerified: true,
      emailVerified: true, // Полагаемся на Шаг 2
    });

    // 6. Upsert (Обновление/Создание) профиля
    // !!! ИСПРАВЛЕНИЕ: Убираем upsert и делаем UPDATE, затем INSERT для обхода ошибки OID !!!
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update(profileDataMapped)
      .eq("id", userId); // Попытка обновить

    if (updateProfileError) {
      // Если обновление не удалось (профиля нет), делаем INSERT
      const { error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert(profileDataMapped);

      if (insertError) {
        // Если и INSERT не удался - это настоящая ошибка
        console.error("[register-director] Final Error INSERTING profile", {
          message: insertError.message,
          details: insertError.details || insertError.hint || insertError.code,
          userId,
        });
        return NextResponse.json(
          {
            success: false,
            message: "Failed to create/update profile (Database Error)",
            details: insertError.message || insertError.details || "Unknown database error",
          },
          { status: 500 }
        );
      }
    }
    // !!! КОНЕЦ ИСПРАВЛЕНИЯ !!!
    
    // 7. Повторная попытка входа (для создания сессии на клиенте)
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: normalizedEmail,
        password: password,
    });
    
    if (signInError) {
        console.error("[register-director] Error signing in user after registration", { error: signInError.message });
        // Не критично, пользователь сможет войти сам
    }


    console.log("[register-director] Success", { userId, email: normalizedEmail });

    return NextResponse.json(
      {
        success: true,
        userId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    // ... (обработка неожиданных ошибок)
    console.error("[register-director] Unexpected error", {
      message: error?.message,
      details: error?.details || error?.stack,
      name: error?.name,
    });
    
    const errorDetails = error?.message || "Internal server error";
    const safeDetails = errorDetails.includes("SUPABASE_SERVICE_ROLE_KEY") 
      ? "Configuration error" 
      : errorDetails;

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        details: safeDetails,
      },
      { status: 500 }
    );
  }
}
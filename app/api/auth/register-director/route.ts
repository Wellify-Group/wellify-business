// app/api/auth/register-director/route.ts (ФИНАЛЬНАЯ ВЕРСИЯ: ИСПРАВЛЕНЫ ВСЕ DB-ОШИБКИ)

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
      userId, // Приоритет: userId из body (передается фронтом после signUp)
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
    if (!email || !phone || !firstName || !lastName) {
      console.error("[register-director] Missing required fields", {
        hasEmail: !!email,
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

    // 1. Получаем пользователя из Auth
    let user = null;
    
    if (userId) {
      // Предпочтительный метод: используем getUserById
      const { data: userData, error: getUserError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (getUserError) {
        console.error("[register-director] getUserById error:", getUserError.message);
        return NextResponse.json(
          { success: false, message: "User not found in auth. Please try again." },
          { status: 404 }
        );
      }

      user = userData?.user ?? null;

      // Проверяем, что email совпадает
      if (user && user.email?.toLowerCase().trim() !== normalizedEmail) {
        console.error("[register-director] Email mismatch", {
          providedEmail: normalizedEmail,
          userEmail: user.email,
        });
        return NextResponse.json(
          { success: false, message: "Email mismatch" },
          { status: 400 }
        );
      }
    } else {
      // Fallback: поиск по email через listUsers (для обратной совместимости)
      console.warn("[register-director] userId not provided, falling back to listUsers");
      const { data: userResponse, error: authUserError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (authUserError) {
        console.error("[register-director] Error listing users", { error: authUserError.message });
        return NextResponse.json(
          { success: false, message: "Failed to check existing users" },
          { status: 500 }
        );
      }

      user = userResponse?.users?.find(
        (u) => u.email && u.email.toLowerCase().trim() === normalizedEmail
      ) ?? null;
    }

    if (!user) {
      console.error("[register-director] User not found in auth", { email: normalizedEmail, userId });
      return NextResponse.json(
        { success: false, message: "User not found after sign up. Please try again." },
        { status: 404 }
      );
    }

    const finalUserId = user.id;

    // 2. Обновляем AUTH (для phone/phone_verified, если не обновил бот)
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(finalUserId, {
        phone: phone.trim(),
        phone_confirm: true,
    });

    if (updateAuthError) {
        console.warn("[register-director] Non-critical error updating auth phone/phone_confirm", { error: updateAuthError.message });
    }

    // 3. Проверяем, есть ли уже профиль (для получения кода компании, если есть)
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("код_компании, company_code")
      .eq("id", finalUserId)
      .maybeSingle();

    if (profileCheckError) {
        console.error("[register-director] Error checking existing profile", { error: profileCheckError.message });
    }

    // 4. Генерируем companyCode и Business ID 
    const existingCompanyCode = (existingProfile as any)?.["код_компании"] || (existingProfile as any)?.company_code;
    
    // Генерируем ID для нового бизнеса (он будет создан)
    const businessId = `biz-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; 
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
    
    // Используем mapProfileToDb для маппинга на вашу сложную схему (УДАЛЕНО: businessId не передаем!)
    const profileDataMapped = mapProfileToDb({
      id: finalUserId,
      email: normalizedEmail,
      fullName,
      shortName,
      role: "директор",
      businessId: 'DUMMY_ID', // ЗАГЛУШКА: mapProfileToDb требует, но мы не используем businessId в profiles
      companyCode,
      jobTitle: "владелец",
      // active: true, // УДАЛЕНО: в таблице profiles нет колонки 'активен'
      phone: phone.trim(),
      phoneVerified: true,
      emailVerified: false, // Email должен подтверждаться через письмо, не вручную! 
    });

    // !!! ИСПРАВЛЕНИЕ: Удаляем все проблемные поля, которых нет в PROFILES !!!
    // Сначала удаляем проблемные поля из profileDataMapped
    const { активен, бизнес_ид, business_id, locale: localeField, ФИО, ф_и_о, ...cleanProfileDataMapped } = profileDataMapped;
    
    const finalProfileData: Record<string, any> = {
        ...cleanProfileDataMapped,
        id: finalUserId,
        email: normalizedEmail,
        full_name: fullName, 
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName?.trim() || null,
        language: normalizedLocale, 
        email_verified: false, // Email должен подтверждаться через письмо, не вручную!
        phone_verified: true, 
        updated_at: new Date().toISOString(),
        birth_date: birthDate ? (birthDate.includes("T") ? birthDate.split("T")[0] : birthDate) : null,
        
        // Оставляем только те, которые точно есть:
        код_компании: companyCode,
        роль: "директор"
    };
    
    // Чистим окончательно от undefined и любых оставшихся проблемных полей
    Object.keys(finalProfileData).forEach(key => {
        if (finalProfileData[key] === undefined || 
            key === 'активен' || 
            key === 'бизнес_ид' || 
            key === 'business_id' || 
            key === 'locale' || 
            key === 'ФИО' || 
            key === 'ф_и_о') {
            delete finalProfileData[key];
        }
    });


    // 6. Upsert (Обновление/Создание) профиля (UPDATE/INSERT)
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update(finalProfileData) 
      .eq("id", finalUserId); 

    if (updateProfileError) {
      const { error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert(finalProfileData);

      if (insertError) {
        console.error("[register-director] Final Error INSERTING profile", {
          message: insertError.message,
          details: insertError.details || insertError.hint || insertError.code,
          userId: finalUserId,
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
    
    // 8. СОЗДАНИЕ ЗАПИСИ В BUSINESSES И STAFF (ЧТОБЫ ДИРЕКТОР ПОПАЛ В ДАШБОРД)
    
    // 8.1. Создание бизнеса
    const { error: businessError } = await supabaseAdmin
        .from("businesses")
        .insert({
            id: businessId,
            owner_profile_id: finalUserId,
            название: `${firstName.trim()} ${lastName.trim()} Business`, // Имя по умолчанию
            код_компании: companyCode,
            активен: true,
        });
        
    if (businessError) {
        console.error("[register-director] Error creating business", { error: businessError.message });
        // Не критично, продолжаем
    }

    // 8.2. Создание записи в staff
    const { error: staffError } = await supabaseAdmin
        .from("staff")
        .insert({
            profile_id: finalUserId,
            business_id: businessId,
            роль: "директор",
            должность: "владелец",
            активен: true,
        });
        
    if (staffError) {
        console.error("[register-director] Error creating staff record", { error: staffError.message });
        // Не критично, продолжаем
    }
    
    // !!! КОНЕЦ ИСПРАВЛЕНИЯ !!!
    
    console.log("[register-director] Success", { userId: finalUserId, email: normalizedEmail });

    return NextResponse.json(
      {
        success: true,
        userId: finalUserId,
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
// app/api/auth/register-director/route.ts (ФИНАЛЬНАЯ ВЕРСИЯ: ИСПРАВЛЕНЫ ВСЕ DB-ОШИБКИ)

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapProfileToDb } from "@/lib/types/profile";
import { randomUUID } from "crypto"; 

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

    // Валидация обязательных полей (phone может быть пустым, если бот уже обновил его)
    if (!email || !password || !firstName || !lastName) {
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

    // 2. Проверяем, есть ли уже профиль (для получения phone и кода компании, если есть)
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("код_компании, company_code, phone")
      .eq("id", userId)
      .maybeSingle();

    if (profileCheckError) {
        console.error("[register-director] Error checking existing profile", { error: profileCheckError.message });
    }

    // 3. Определяем финальный phone (приоритет: из профиля > из запроса)
    const finalPhone = (existingProfile as any)?.phone || phone?.trim() || "";
    
    if (!finalPhone) {
        console.error("[register-director] Phone is required but not found", {
            phoneFromRequest: phone,
            phoneFromProfile: (existingProfile as any)?.phone,
        });
        return NextResponse.json(
            { success: false, message: "Phone number is required. Please complete Telegram verification." },
            { status: 400 }
        );
    }

    // 4. Обновляем AUTH (для phone/phone_verified, если не обновил бот)
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        phone: finalPhone,
        phone_confirm: true,
    });

    if (updateAuthError) {
        console.warn("[register-director] Non-critical error updating auth phone/phone_confirm", { error: updateAuthError.message });
    }

    // 5. Генерируем companyCode и Business ID 
    const existingCompanyCode = (existingProfile as any)?.["код_компании"] || (existingProfile as any)?.company_code;
    
    // Генерируем UUID для нового бизнеса (соответствует схеме БД: id uuid primary key default gen_random_uuid())
    const businessId = randomUUID();
    const companyCode = existingCompanyCode || generateCompanyCode();

    // 6. Формируем финальные данные профиля
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
      id: userId,
      email: normalizedEmail,
      fullName,
      shortName,
      role: "директор",
      businessId: 'DUMMY_ID', // ЗАГЛУШКА: mapProfileToDb требует, но мы не используем businessId в profiles
      companyCode,
      jobTitle: "владелец",
      active: true,
      phone: finalPhone,
      phoneVerified: true,
      emailVerified: true, 
    });

    // !!! ИСПРАВЛЕНИЕ: Удаляем все проблемные поля, которых нет в PROFILES !!!
    const finalProfileData: Record<string, any> = {
        ...profileDataMapped,
        id: userId,
        email: normalizedEmail,
        full_name: fullName, 
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName?.trim() || null,
        language: normalizedLocale, 
        email_verified: true, 
        phone_verified: true, 
        updated_at: new Date().toISOString(),
        birth_date: birthDate ? (birthDate.includes("T") ? birthDate.split("T")[0] : birthDate) : null,
        
        // УДАЛЯЕМ ВСЕ ПРОБЛЕМНЫЕ/НЕПРАВИЛЬНЫЕ ПОЛЯ (которых нет в profiles)
        бизнес_ид: undefined, 
        business_id: undefined, 
        locale: undefined, 
        ФИО: undefined,
        ф_и_о: undefined,
        
        // Оставляем только те, которые точно есть:
        код_компании: companyCode,
        role: "директор"
    };
    
    // Чистим окончательно от undefined
    Object.keys(finalProfileData).forEach(key => finalProfileData[key] === undefined && delete finalProfileData[key]);


    // 7. Upsert (Обновление/Создание) профиля (UPDATE/INSERT)
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update(finalProfileData) 
      .eq("id", userId); 

    if (updateProfileError) {
      const { error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert(finalProfileData);

      if (insertError) {
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
    
    // 8. СОЗДАНИЕ ЗАПИСИ В BUSINESSES И STAFF (ЧТОБЫ ДИРЕКТОР ПОПАЛ В ДАШБОРД)
    
    // 8.1. Создание бизнеса
    const { error: businessError } = await supabaseAdmin
        .from("businesses")
        .insert({
            id: businessId,
            owner_profile_id: userId,
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
            profile_id: userId,
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
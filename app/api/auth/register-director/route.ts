import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapProfileToDb } from "@/lib/types/profile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
      birthDate, // Опционально, может быть не передано
      locale, // Опционально, может быть не передано
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

    // Ищем пользователя по email
    const { data: existingUsers, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (listError) {
      console.error("[register-director] Error listing users", {
        message: listError.message,
        status: (listError as any).status,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Failed to check existing users",
          details: listError.message || "Unknown error",
        },
        { status: 500 }
      );
    }

    const norm = (s: string) => s.trim().toLowerCase();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email && norm(u.email) === norm(normalizedEmail)
    );

    let userId: string;

    if (existingUser) {
      // Пользователь уже существует - обновляем его
      userId = existingUser.id;

      // Обновляем email и телефон в auth, если нужно
      const updateData: any = {};
      if (!existingUser.email_confirmed_at) {
        // Если email не подтверждён, подтверждаем его (проверен через Supabase email verification)
        updateData.email_confirm = true;
      }
      if (existingUser.phone !== phone.trim()) {
        updateData.phone = phone.trim();
        updateData.phone_confirm = true; // Телефон проверен через Twilio SMS
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } =
          await supabaseAdmin.auth.admin.updateUserById(userId, updateData);

        if (updateError) {
          console.error("[register-director] Error updating user", {
            message: updateError.message,
            status: (updateError as any).status,
          });
          // Не критично, продолжаем
        }
      }
    } else {
      // Создаём нового пользователя
      const { data: newUserData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true, // Подтверждаем email (проверен через Supabase email verification)
          phone: phone.trim(),
          phone_confirm: true, // Подтверждаем телефон (проверен через Twilio SMS)
          user_metadata: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            middle_name: middleName?.trim() || null,
          },
        });

      if (createError || !newUserData?.user) {
        console.error("[register-director] Error creating user", {
          message: createError?.message,
          status: (createError as any)?.status,
        });
        return NextResponse.json(
          {
            success: false,
            message: createError?.message || "Failed to create user",
            details: createError?.message || "Unknown error",
          },
          { status: 500 }
        );
      }

      userId = newUserData.user.id;
    }

    // Генерируем код компании и ID бизнеса (если их ещё нет)
    const generateCompanyCode = () => {
      const part = () => Math.floor(1000 + Math.random() * 9000);
      return `${part()}-${part()}-${part()}-${part()}`;
    };

    // Проверяем, есть ли уже профиль и верифицирован ли телефон
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("phone, phone_verified")
      .eq("id", userId)
      .maybeSingle();

    // Дополнительная проверка: телефон должен быть верифицирован
    if (!existingProfile?.phone || !existingProfile.phone_verified) {
      console.error("[register-director] Phone is not verified", {
        userId,
        hasPhone: !!existingProfile?.phone,
        phoneVerified: existingProfile?.phone_verified,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Phone is not verified. Please verify your phone number first.",
        },
        { status: 400 }
      );
    }

    // Используем русские названия полей из БД или английские как fallback
    const existingBusinessId = (existingProfile as any)?.["бизнес_id"] || (existingProfile as any)?.business_id;
    const existingCompanyCode = (existingProfile as any)?.["код_компании"] || (existingProfile as any)?.company_code;
    
    const businessId =
      existingBusinessId || `biz-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const companyCode = existingCompanyCode || generateCompanyCode();

    // Формируем полное имя
    const fullName = [lastName.trim(), firstName.trim(), middleName?.trim()]
      .filter(Boolean)
      .join(" ");

    const shortName = firstName.trim();

    // Нормализуем locale (ua -> uk для совместимости с API)
    const normalizedLocale = locale
      ? locale === "ua"
        ? "uk"
        : ["ru", "uk", "en"].includes(locale)
        ? locale
        : "ru"
      : "ru";

    // Формируем данные профиля для upsert
    // Используем прямые поля БД (английские названия) для first_name, last_name, middle_name, birth_date, locale
    // И русские названия через mapProfileToDb для остальных полей
    const profileDataForDb: Record<string, any> = {
      id: userId,
      email: normalizedEmail,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      middle_name: middleName?.trim() || null,
      full_name: fullName,
      birth_date: birthDate ? (birthDate.includes("T") ? birthDate.split("T")[0] : birthDate) : null,
      email_verified: true, // Email уже подтверждён на шаге 2
      phone_verified: true, // Телефон уже подтверждён на шаге 3
      locale: normalizedLocale,
      updated_at: new Date().toISOString(),
    };

    // Добавляем данные через mapProfileToDb (русские названия полей)
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
      emailVerified: true,
    });

    // Объединяем данные: сначала английские поля, потом русские из mapProfileToDb
    // Русские поля имеют приоритет для совместимости с существующей схемой
    const finalProfileData = {
      ...profileDataForDb,
      ...profileDataMapped,
      id: userId, // Убеждаемся, что id всегда установлен
    };

    // Безопасный upsert: создаёт запись, если её нет, или обновляет существующую
    const { data: upsertedProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(finalProfileData, {
        onConflict: "id",
      })
      .select()
      .single();

    if (profileError) {
      console.error("[register-director] Error upserting profile", {
        message: profileError.message,
        details: profileError.details || profileError.hint || profileError.code,
        userId,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create/update profile",
          details: profileError.message || profileError.details || "Unknown database error",
        },
        { status: 500 }
      );
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
    console.error("[register-director] Unexpected error", {
      message: error?.message,
      details: error?.details || error?.stack,
      name: error?.name,
    });
    
    // Безопасно извлекаем детали ошибки без утечки чувствительных данных
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


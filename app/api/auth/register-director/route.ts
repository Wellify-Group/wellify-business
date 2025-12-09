import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mapProfileToDb } from "@/lib/types/profile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Создаём admin-клиент ТОЛЬКО внутри handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[register-director] Missing Supabase envs");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await request.json();
    const {
      email,
      password,
      phone,
      firstName,
      lastName,
      middleName,
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
      console.error("[register-director] Error listing users", listError);
      return NextResponse.json(
        { success: false, message: "Failed to check existing users" },
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

      // Проверяем, что email подтверждён
      if (!existingUser.email_confirmed_at) {
        console.error(
          "[register-director] User exists but email not confirmed",
          userId
        );
        return NextResponse.json(
          {
            success: false,
            message: "Email not confirmed. Please confirm your email first.",
          },
          { status: 400 }
        );
      }

      // Обновляем телефон в auth, если нужно
      if (existingUser.phone !== phone.trim()) {
        const { error: updateError } =
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            phone: phone.trim(),
            phone_confirm: true,
          });

        if (updateError) {
          console.error("[register-director] Error updating phone", updateError);
          // Не критично, продолжаем
        }
      }
    } else {
      // Создаём нового пользователя
      const { data: newUserData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true, // Автоматически подтверждаем email
          phone: phone.trim(),
          phone_confirm: true,
          user_metadata: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            middle_name: middleName?.trim() || null,
          },
        });

      if (createError || !newUserData?.user) {
        console.error("[register-director] Error creating user", createError);
        return NextResponse.json(
          {
            success: false,
            message: createError?.message || "Failed to create user",
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

    // Проверяем, есть ли уже профиль
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

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

    // Создаём или обновляем профиль директора
    const profileData = mapProfileToDb({
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

    // Удаляем id из данных для upsert
    const { id, ...updateData } = profileData;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          ...updateData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (profileError) {
      console.error("[register-director] Error upserting profile", profileError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create/update profile",
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
    console.error("[register-director] Unexpected error", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}


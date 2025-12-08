import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Получаем текущего пользователя
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Получаем данные из запроса
    const body = await request.json();
    const {
      firstName,
      lastName,
      middleName,
      birthDate,
      email,
      phone,
    } = body;

    // Валидация обязательных полей
    if (!firstName || !lastName || !birthDate || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Формируем полное имя (Фамилия Имя Отчество)
    const fullName = [
      lastName.trim(),
      firstName.trim(),
      middleName?.trim(),
    ]
      .filter(Boolean)
      .join(" ") || null;

    // Формируем короткое имя (только имя)
    const shortName = firstName.trim() || null;

    // Обновляем профиль в таблице profiles
    // Используем английские названия колонок, которые есть в базе данных
    const profileUpdate: Record<string, any> = {
      email: email.trim(),
      full_name: fullName,
      phone: phone.trim(),
      birth_date: birthDate,
      role: "director", // Устанавливаем роль директора
      updated_at: new Date().toISOString(),
    };

    // Обновляем профиль в таблице profiles
    const { error: profileError, data: updatedProfile } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id)
      .select();

    if (profileError) {
      console.error("Failed to update profile", {
        error: profileError,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
        profileUpdate,
        userId: user.id,
      });
      return NextResponse.json(
        { 
          error: "Failed to update profile",
          details: profileError.message || "Unknown error"
        },
        { status: 500 }
      );
    }

    console.log("Profile updated successfully", { updatedProfile });

    // Опционально: обновляем телефон в user_metadata
    try {
      await supabase.auth.updateUser({
        data: {
          phone: phone.trim(),
        },
      });
    } catch (metadataError) {
      // Не критично, если не удалось обновить metadata
      console.warn("Failed to update user metadata:", metadataError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in complete-registration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


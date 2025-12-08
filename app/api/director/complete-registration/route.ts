import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

    // Формируем полное имя
    const fullName = [
      lastName.trim(),
      firstName.trim(),
      middleName?.trim(),
    ]
      .filter(Boolean)
      .join(" ") || null;

    // Обновляем профиль в таблице profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName?.trim() || null,
        full_name: fullName,
        birth_date: birthDate,
        phone: phone.trim(),
        email: email.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Failed to update profile", profileError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

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


import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapProfileToDb } from "@/lib/types/profile";

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

    // Получаем текущий профиль, чтобы сохранить роль и бизнес_id, если они есть
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("роль, бизнес_id")
      .eq("id", user.id)
      .single();

    // Если профиль не найден, создаем его с базовыми данными
    if (profileFetchError && profileFetchError.code === 'PGRST116') {
      // Профиль не существует, создаем новый
      const businessId = `biz-${Date.now()}`;
      const companyCode = (() => {
        const part = () => Math.floor(1000 + Math.random() * 9000);
        return `${part()}-${part()}-${part()}-${part()}`;
      })();

      const profileData = mapProfileToDb({
        id: user.id,
        email: email.trim(),
        fullName: fullName,
        shortName: shortName,
        role: "директор",
        businessId: businessId,
        companyCode: companyCode,
        phone: phone.trim(),
        active: true,
      });

      const { error: insertError } = await supabase
        .from("profiles")
        .insert(profileData);

      if (insertError) {
        console.error("Failed to create profile", insertError);
        return NextResponse.json(
          { error: "Failed to create profile" },
          { status: 500 }
        );
      }
    } else {
      // Профиль существует, обновляем его
      // Подготавливаем данные для обновления профиля с русскими названиями полей
      const profileUpdate = mapProfileToDb({
        fullName: fullName,
        shortName: shortName,
        email: email.trim(),
        phone: phone.trim(),
        // Сохраняем существующие роль и бизнес_id, если они есть
        role: existingProfile?.роль || "директор",
        businessId: existingProfile?.бизнес_id || null,
      });

      // Обновляем профиль в таблице profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user.id);

      if (profileError) {
        console.error("Failed to update profile", profileError);
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }
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


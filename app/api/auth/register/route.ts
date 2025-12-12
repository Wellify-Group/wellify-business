// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Админ-клиент Supabase (service role)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Простая генерация кода компании
function generateCompanyCode() {
  const part = () => Math.floor(1000 + Math.random() * 9000);
  return `${part()}-${part()}-${part()}-${part()}`;
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const body = await request.json();

    const {
      email,
      password,
      fullName,
      firstName,
      lastName,
      middleName,
      birthDate,
      language,
      businessName,
    } = body ?? {};

    // === Валидация базовых полей ===
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Имя директора
    const safeFirstName =
      (firstName && String(firstName).trim()) ||
      (fullName && String(fullName).trim().split(" ")[0]) ||
      "Директор";

    const safeLastName =
      (lastName && String(lastName).trim()) || null;

    const safeMiddleName =
      (middleName && String(middleName).trim()) || null;

    const safeFullName =
      (fullName && String(fullName).trim()) ||
      [safeFirstName, safeLastName].filter(Boolean).join(" ") ||
      "Директор";

    const safeLanguage = (language && String(language)) || "ru";
    const safeBusinessName =
      (businessName && String(businessName).trim()) || "Мой бизнес";

    // === Генерируем код компании ===
    const companyCode = generateCompanyCode();

    // === РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ В AUTH ===
    const { data: signUpData, error: signUpError } =
      await supabaseAdmin.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            // поля, которые заберёт триггер handle_new_user
            first_name: safeFirstName,
            last_name: safeLastName,
            middle_name: safeMiddleName,
            full_name: safeFullName,
            birth_date: birthDate || null,
            role: "директор",
            language: safeLanguage,
          },
        },
      });

    if (signUpError) {
      console.error("Supabase signUp error:", signUpError);

      const msg = (signUpError.message || "").toLowerCase();

      if (
        msg.includes("already registered") ||
        msg.includes("user already registered") ||
        msg.includes("already exists")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "User with this email already exists",
            errorCode: "EMAIL_ALREADY_REGISTERED",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Registration failed",
          errorCode: "REGISTER_UNKNOWN_ERROR",
        },
        { status: 500 },
      );
    }

    const user = signUpData?.user;

    if (!user || !user.id) {
      console.error("No user returned from signUp");
      return NextResponse.json(
        {
          success: false,
          error: "Registration failed",
          errorCode: "REGISTER_UNKNOWN_ERROR",
        },
        { status: 500 },
      );
    }

    const userId = user.id as string;

    // === ЖДЁМ/ПРОВЕРЯЕМ НАЛИЧИЕ ПРОФИЛЯ (его создаёт триггер handle_new_user) ===
    const { data: profileRow, error: profileSelectError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (profileSelectError || !profileRow) {
      console.error("Profile select error after signUp:", profileSelectError);

      // Чистим auth-пользователя, чтобы не висел "битый" аккаунт
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (deleteError) {
        console.error(
          "Failed to delete user after profileSelectError:",
          deleteError,
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to create user profile",
          errorCode: "PROFILE_CREATION_FAILED",
        },
        { status: 500 },
      );
    }

    // === СОЗДАЁМ БИЗНЕС В businesses ===
    // ВАЖНО: русские колонки берём через индексный доступ и any,
    // чтобы TS не пытался типизировать их и не падал.
    const { data: businessRowRaw, error: businessError } = await supabaseAdmin
      .from("businesses")
      .insert({
        owner_profile_id: userId,
        // колонки с кириллицей
        название: safeBusinessName,
        код_компании: companyCode,
      } as any)
      .select("id, название, код_компании")
      .single();

    if (businessError || !businessRowRaw) {
      console.error("Create business error:", businessError);

      // Откатываем пользователя и профиль
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (deleteError) {
        console.error("Failed to delete user after businessError:", deleteError);
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to create business",
          errorCode: "BUSINESS_CREATION_FAILED",
        },
        { status: 500 },
      );
    }

    const businessRow = businessRowRaw as any;
    const businessId = String(businessRow.id);
    const businessNameDb = businessRow["название"] as string | undefined;
    const businessCompanyCodeDb =
      businessRow["код_компании"] as string | undefined;

    // === СОЗДАЁМ ЗАПИСЬ В staff ДЛЯ ДИРЕКТОРА ===
    const { error: staffError } = await supabaseAdmin.from("staff").insert({
      profile_id: userId,
      business_id: businessId,
      // колонки с кириллицей - тоже через any, но TS их не трогает,
      // потому что объект без жёсткой типизации
      роль: "директор",
      должность: "владелец",
      активен: true,
    } as any);

    if (staffError) {
      console.error("Create staff (director) error:", staffError);

      // Откатываем бизнес и пользователя
      try {
        await supabaseAdmin.from("businesses").delete().eq("id", businessId);
      } catch (bizDeleteError) {
        console.error(
          "Failed to delete business after staffError:",
          bizDeleteError,
        );
      }

      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (deleteError) {
        console.error("Failed to delete user after staffError:", deleteError);
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to create staff record",
          errorCode: "STAFF_CREATION_FAILED",
        },
        { status: 500 },
      );
    }

    // === УСПЕШНЫЙ ОТВЕТ ===
    return NextResponse.json(
      {
        success: true,
        user: {
          id: userId,
          email: user.email,
          fullName: safeFullName,
          role: "director", // фронту отдаём английское значение
        },
        business: {
          id: businessId,
          name: businessNameDb ?? safeBusinessName,
          companyCode: businessCompanyCodeDb ?? companyCode,
        },
        companyCode: businessCompanyCodeDb ?? companyCode,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error (unexpected):", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}

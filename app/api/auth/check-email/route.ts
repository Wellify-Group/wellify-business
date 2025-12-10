// app/api/auth/check-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Вспомогательная функция для обрезки строки
const trim = (str: string) => str.trim().replace(/\s+/g, ' ');

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { confirmed: false, message: "E-mail is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("[check-email] Missing Supabase envs");
      return NextResponse.json(
        { confirmed: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const normalized = email.trim().toLowerCase();

    // 1. Ищем пользователя в auth.users
    const { data: usersPage, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (listError) {
      console.error("[check-email] listUsers error", listError);
      return NextResponse.json(
        { confirmed: false, message: "Failed to check email" },
        { status: 500 }
      );
    }

    const user = usersPage?.users?.find(
      (u) => u.email && u.email.toLowerCase().trim() === normalized
    );

    if (!user) {
      // Пользователь ещё не создан
      return NextResponse.json({ confirmed: false }, { status: 200 });
    }

    // 2. Проверяем, подтверждён ли e-mail в auth.users ИЛИ в profiles.email_verified
    // Сначала проверяем profiles.email_verified (более надежно, так как обновляется триггером)
    const { data: profile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("email_verified")
      .eq("id", user.id)
      .single();

    const isEmailVerifiedInProfile = profile?.email_verified === true;
    const isEmailConfirmedInAuth = !!user.email_confirmed_at;

    // Email считается подтверждённым, если подтверждён в auth.users ИЛИ в profiles
    if (!isEmailConfirmedInAuth && !isEmailVerifiedInProfile) {
      return NextResponse.json({ confirmed: false }, { status: 200 });
    }

    // 3. Синхронизируем профиль (обновляем email_verified если нужно)
    const meta = user.user_metadata || {};
    
    // Формируем full_name из метаданных, если его нет
    const fullName = meta.full_name || 
      (meta.last_name || meta.first_name || meta.middle_name
        ? trim(
            `${meta.last_name || ''} ${meta.first_name || ''} ${meta.middle_name || ''}`
          )
        : null);

    const { error: profileUpsertError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          first_name: meta.first_name ?? null,
          last_name: meta.last_name ?? null,
          middle_name: meta.middle_name ?? null,
          full_name: fullName,
          birth_date: meta.birth_date ?? null,
          email_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profileUpsertError) {
      console.error("[check-email] upsert profile error", profileUpsertError);
      // e-mail уже подтверждён, но профиль не обновили - это не блокирует переход дальше
      return NextResponse.json(
        {
          confirmed: true,
          userId: user.id,
          profileUpdated: false,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        confirmed: true,
        userId: user.id,
        profileUpdated: true,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[check-email] unexpected error", err);
    return NextResponse.json(
      {
        confirmed: false,
        message: err?.message ?? "Internal server error",
      },
      { status: 500 }
    );
  }
}

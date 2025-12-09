// app/api/auth/check-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // 2. Проверяем, подтверждён ли e-mail в auth.users
    if (!user.email_confirmed_at) {
      return NextResponse.json({ confirmed: false }, { status: 200 });
    }

    // 3. Синхронизируем профиль
    const meta = user.user_metadata || {};

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          first_name: meta.first_name ?? null,
          last_name: meta.last_name ?? null,
          middle_name: meta.middle_name ?? null,
          birth_date: meta.birth_date ?? null,
          email_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("[check-email] upsert profile error", profileError);
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

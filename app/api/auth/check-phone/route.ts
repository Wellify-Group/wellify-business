// app/api/auth/check-phone/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { verified: false, message: "Phone is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminSupabaseClient();

    const normalizedPhone = phone.trim();

    // 1. Ищем пользователя в auth.users по телефону
    const { data: usersPage, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (listError) {
      console.error("[check-phone] listUsers error", listError);
      return NextResponse.json(
        { verified: false, message: "Failed to check phone" },
        { status: 500 }
      );
    }

    const user = usersPage?.users?.find(
      (u) => u.phone && u.phone.trim() === normalizedPhone
    );

    if (!user) {
      // Пользователь ещё не создан или телефон не найден
      return NextResponse.json({ verified: false }, { status: 200 });
    }

    // 2. Проверяем phone_verified в profiles
    const { data: profile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("phone_verified, phone")
      .eq("id", user.id)
      .single();

    if (profileCheckError) {
      console.error("[check-phone] profile check error", profileCheckError);
      return NextResponse.json(
        { verified: false, message: "Failed to check profile" },
        { status: 500 }
      );
    }

    const isPhoneVerifiedInProfile = profile?.phone_verified === true;

    // Phone считается подтверждённым, если phone_verified === true в profiles
    if (!isPhoneVerifiedInProfile) {
      return NextResponse.json({ verified: false }, { status: 200 });
    }

    return NextResponse.json(
      {
        verified: true,
        userId: user.id,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[check-phone] unexpected error", err);
    return NextResponse.json(
      {
        verified: false,
        message: err?.message ?? "Internal server error",
      },
      { status: 500 }
    );
  }
}


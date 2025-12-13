// app/api/auth/check-telegram-verified/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminSupabaseClient();

    // Проверяем telegram_verified в профиле
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("telegram_verified, phone, email, first_name, last_name, middle_name, birth_date")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[check-telegram-verified] Error fetching profile", error);
      return NextResponse.json(
        { success: false, error: "Failed to check profile" },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      telegramVerified: profile.telegram_verified === true,
      phone: profile.phone || null,
      profileData: {
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        middleName: profile.middle_name,
        birthDate: profile.birth_date,
      },
    });
  } catch (error: any) {
    console.error("[check-telegram-verified] Unexpected error", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}


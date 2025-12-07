import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/profile/update-after-confirm
 * Обновляет профиль после подтверждения email (использует service role для обхода RLS)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, profileData } = body;

    console.log("API route called with:", { userId, profileData });

    if (!userId || !profileData) {
      console.error("Missing required fields:", { hasUserId: !!userId, hasProfileData: !!profileData });
      return NextResponse.json(
        { success: false, error: "Missing userId or profileData" },
        { status: 400 }
      );
    }

    // Используем admin клиент для обхода RLS
    const supabaseAdmin = createAdminSupabaseClient();

    const updateData = {
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString(),
    };

    console.log("Updating profile with data:", updateData);

    // Обновляем профиль
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert(updateData, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("Error updating profile via API:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: 500 }
      );
    }

    console.log("Profile updated successfully via API:", data);

    return NextResponse.json({
      success: true,
      profile: data,
    });
  } catch (error: any) {
    console.error("Unexpected error updating profile:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


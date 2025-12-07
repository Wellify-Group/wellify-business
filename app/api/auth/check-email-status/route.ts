import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/auth/check-email-status
 * Проверяет статус подтверждения email по адресу email (без необходимости в сессии)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminSupabaseClient();

    // Проверяем профиль по email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, email_verified")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (profileError) {
      console.error("Error checking email status:", profileError);
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json({
        success: true,
        emailVerified: false,
        message: "Profile not found",
      });
    }

    return NextResponse.json({
      success: true,
      emailVerified: profile.email_verified === true,
      profileId: profile.id,
    });
  } catch (error: any) {
    console.error("Unexpected error checking email status:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


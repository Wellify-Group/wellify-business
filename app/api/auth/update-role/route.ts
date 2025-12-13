// app/api/auth/update-role/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: "userId and role are required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminSupabaseClient();

    // Обновляем role в профиле
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (updateError) {
      console.error("[update-role] Error updating role", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update role" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[update-role] Unexpected error", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}


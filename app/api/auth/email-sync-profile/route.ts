/**
 * Sync profile after email confirmation
 * Creates or updates profile with email_verified = true
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[email-sync-profile] Missing Supabase envs");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, message: "userId and email are required" },
        { status: 400 }
      );
    }

    // Проверяем, есть ли уже профиль
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const normalizedEmail = email.toLowerCase().trim();

    if (existingProfile) {
      // Обновляем существующий профиль
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          email: normalizedEmail,
          email_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.error("[email-sync-profile] Error updating profile", updateError);
        return NextResponse.json(
          { success: false, message: "Failed to update profile" },
          { status: 500 }
        );
      }
    } else {
      // Создаём новый профиль
      const { error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          email: normalizedEmail,
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("[email-sync-profile] Error creating profile", insertError);
        return NextResponse.json(
          { success: false, message: "Failed to create profile" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[email-sync-profile] Unexpected error", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}


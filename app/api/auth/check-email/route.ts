/**
 * Check if email is confirmed in Supabase
 * 
 * This endpoint is used during registration to verify that the user
 * has clicked the confirmation link sent by Supabase.
 * 
 * We use Supabase's built-in email verification, NOT Twilio.
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
      console.error("[check-email] Missing Supabase envs");
      return NextResponse.json(
        { confirmed: false, message: "Server configuration error" },
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
    const emailRaw = body?.email;

    if (!emailRaw || typeof emailRaw !== "string") {
      return NextResponse.json(
        { confirmed: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = emailRaw.trim().toLowerCase();

    // В supabase-js v2 нет getUserByEmail, поэтому:
    // 1) вытаскиваем пользователей пачкой
    // 2) фильтруем по email на стороне сервера
    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (listError) {
      console.error("[check-email] Error listing users", listError);
      return NextResponse.json(
        { confirmed: false, message: "Failed to check email" },
        { status: 500 }
      );
    }

    const users = usersData?.users ?? [];

    const user = users.find(
      (u) =>
        u.email &&
        u.email.trim().toLowerCase() === normalizedEmail
    );

    if (!user) {
      return NextResponse.json(
        { confirmed: false, message: "User not found" },
        { status: 200 }
      );
    }

    const confirmed = !!user.email_confirmed_at;

    return NextResponse.json(
      {
        confirmed,
        userId: user.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[check-email] Unexpected error", error);
    return NextResponse.json(
      {
        confirmed: false,
        message: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}


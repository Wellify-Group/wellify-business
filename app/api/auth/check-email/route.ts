import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[check-email] Missing Supabase envs");
      return NextResponse.json(
        { confirmed: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { confirmed: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Ищем пользователя по email среди auth.users
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      console.error("[check-email] listUsers error", error);
      return NextResponse.json(
        { confirmed: false, message: "Failed to check email" },
        { status: 500 }
      );
    }

    const norm = (s: string) => s.trim().toLowerCase();
    const normalizedEmail = norm(email);

    const existingUser = data.users.find(
      (u) => u.email && norm(u.email) === normalizedEmail
    );

    if (!existingUser) {
      return NextResponse.json({ confirmed: false }, { status: 200 });
    }

    const confirmed = !!existingUser.email_confirmed_at;

    return NextResponse.json({
      confirmed,
      userId: existingUser.id,
    });
  } catch (e: any) {
    console.error("[check-email] Unexpected error", e);
    return NextResponse.json(
      { confirmed: false, message: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

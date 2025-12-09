// app/api/auth/check-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { confirmed: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[check-email] Missing Supabase envs");
      return NextResponse.json(
        { confirmed: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const norm = (s: string) => s.trim().toLowerCase();

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      console.error("[check-email] listUsers error", error);
      return NextResponse.json(
        { confirmed: false, message: "Failed to check users" },
        { status: 500 }
      );
    }

    const user = data.users.find(
      (u) => u.email && norm(u.email) === norm(email)
    );

    if (!user) {
      // Пользователя с таким email ещё нет
      return NextResponse.json(
        {
          confirmed: false,
          exists: false,
        },
        { status: 200 }
      );
    }

    const confirmed = !!user.email_confirmed_at;

    return NextResponse.json(
      {
        confirmed,
        exists: true,
        userId: user.id,
        emailConfirmedAt: user.email_confirmed_at,
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

// app/api/auth/check-email/route.ts
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error("[check-email] Missing Supabase envs", {
      hasUrl: !!url,
      hasServiceRoleKey: !!serviceRoleKey,
    });
    return null;
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    if (!adminClient) {
      // В проде это будет 500, но главное - модуль не падает на импорт
      return NextResponse.json(
        { ok: false, error: "Server config error (Supabase)" },
        { status: 500 }
      );
    }

    // 1. Берём первую страницу пользователей
    const { data, error } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      console.error("[check-email] listUsers error", error);
      return NextResponse.json(
        { ok: false, error: "Supabase error" },
        { status: 500 }
      );
    }

    const norm = (s: string) => s.trim().toLowerCase();

    const user =
      data?.users?.find(
        (u) => u.email && norm(u.email) === norm(email as string)
      ) ?? null;

    if (!user) {
      return NextResponse.json(
        { ok: true, confirmed: false, reason: "USER_NOT_FOUND" },
        { status: 200 }
      );
    }

    const confirmed = !!user.email_confirmed_at;

    return NextResponse.json(
      {
        ok: true,
        confirmed,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[check-email] unexpected", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
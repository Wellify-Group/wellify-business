// app/api/auth/check-email/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { confirmed: false, userId: null },
        { status: 400 }
      );
    }

    // Создаём admin-клиент ТОЛЬКО внутри handler, чтобы не вызывался при build
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      console.error("[check-email] Missing Supabase envs", {
        hasUrl: !!url,
        hasServiceRoleKey: !!serviceRoleKey,
      });
      return NextResponse.json(
        { confirmed: false, userId: null },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    // Ищем пользователя по email
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      console.error("[check-email] listUsers error", error);
      return NextResponse.json(
        { confirmed: false, userId: null },
        { status: 500 }
      );
    }

    const norm = (s: string) => s.trim().toLowerCase();
    const normalizedEmail = norm(email as string);

    const user =
      data?.users?.find(
        (u) => u.email && norm(u.email) === normalizedEmail
      ) ?? null;

    if (!user) {
      return NextResponse.json(
        { confirmed: false, userId: null },
        { status: 200 }
      );
    }

    const confirmed = !!user.email_confirmed_at;

    return NextResponse.json(
      {
        confirmed,
        userId: user.id ?? null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[check-email] unexpected", e);
    return NextResponse.json(
      { confirmed: false, userId: null },
      { status: 500 }
    );
  }
}
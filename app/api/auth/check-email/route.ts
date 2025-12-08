import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service_role, НЕ anon
);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      filter: { email }
    });

    if (error) {
      console.error("[check-email] admin.listUsers error", error);
      return NextResponse.json(
        { ok: false, error: "Supabase error" },
        { status: 500 }
      );
    }

    const user = data?.users?.[0];

    if (!user) {
      return NextResponse.json(
        { ok: false, confirmed: false, reason: "USER_NOT_FOUND" },
        { status: 200 }
      );
    }

    const confirmed = !!user.email_confirmed_at;

    return NextResponse.json({ ok: true, confirmed }, { status: 200 });
  } catch (e: any) {
    console.error("[check-email] unexpected", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


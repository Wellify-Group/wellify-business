// app/api/support/chat/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // пробуем взять авторизованного пользователя
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json().catch(() => ({}));
    const guestHash: string | null = body?.guestHash ?? null;

    const cid = randomUUID();

    const { data, error } = await supabase
      .from("support_sessions")
      .insert({
        cid,
        user_id: user ? user.id : null,
        guest_hash: user ? null : guestHash,
        status: "new",
      })
      .select("cid")
      .single();

    if (error || !data) {
      console.error("support:start error", error);
      return NextResponse.json(
        { ok: false, error: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, cid: data.cid });
  } catch (e) {
    console.error("support:start unexpected", e);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

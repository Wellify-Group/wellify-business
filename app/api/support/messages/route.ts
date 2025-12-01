// app/api/support/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupportStore, getMessages } from "@/lib/support-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cid = req.nextUrl.searchParams.get("cid");

    if (!cid) {
      // Нет cid - просто пустой список, чтобы фронт не падал
      return NextResponse.json({ ok: true, messages: [] });
    }

    const store = getSupportStore();
    const messages = getMessages(cid);

    return NextResponse.json({ ok: true, messages });
  } catch (e) {
    console.error("GET /api/support/messages failed", e);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", messages: [] },
      { status: 200 }
    );
  }
}

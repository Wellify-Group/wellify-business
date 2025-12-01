// app/api/support/poll/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAndClearPendingMessages } from "@/lib/supportSession";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cid = req.nextUrl.searchParams.get("cid");

    if (!cid) {
      return NextResponse.json(
        { ok: true, messages: [] },
        { status: 200 }
      );
    }

    // Получаем и очищаем pending messages
    const messages = getAndClearPendingMessages(cid);

    return NextResponse.json({
      ok: true,
      messages,
    });
  } catch (error) {
    console.error("GET /api/support/poll error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", messages: [] },
      { status: 200 }
    );
  }
}


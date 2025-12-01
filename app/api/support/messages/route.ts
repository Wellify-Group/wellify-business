// app/api/support/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupportMessages } from "@/lib/supportStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const cid = url.searchParams.get("cid");

    if (!cid) {
      return NextResponse.json(
        { ok: false, error: "CID_REQUIRED", messages: [] },
        { status: 400 }
      );
    }

    const messages = getSupportMessages(cid);

    return NextResponse.json(
      {
        ok: true,
        messages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/support/messages error", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", messages: [] },
      { status: 500 }
    );
  }
}


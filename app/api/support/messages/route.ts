import { NextResponse } from "next/server";
import { getSupportMessages } from "@/lib/db/support";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cid = searchParams.get("cid");

    if (!cid) {
      return NextResponse.json(
        { ok: false, error: "MISSING_CID" },
        { status: 400 }
      );
    }

    const messages = await getSupportMessages(cid);

    return NextResponse.json({ ok: true, messages }, { status: 200 });
  } catch (error) {
    console.error("[/api/support/messages] error", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getMessagesByCid } from "@/lib/supportChatStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cid = searchParams.get("cid");
    const since = searchParams.get("since");

    // Валидация
    if (!cid) {
      return NextResponse.json(
        { ok: false, error: "CID is required" },
        { status: 400 }
      );
    }

    // Получаем сообщения
    const messages = await getMessagesByCid(cid, since || undefined);

    return NextResponse.json({
      ok: true,
      messages,
    });
  } catch (error) {
    console.error("Error in get messages route:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}


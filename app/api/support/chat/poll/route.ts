// app/api/support/chat/poll/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAndMarkUnreadMessages } from "@/lib/db-support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cid = req.nextUrl.searchParams.get("cid");

    if (!cid) {
      return NextResponse.json(
        { ok: false, error: "CID_REQUIRED", messages: [] },
        { status: 400 }
      );
    }

    // Получаем непрочитанные сообщения и помечаем их как прочитанные
    const messages = await getAndMarkUnreadMessages(cid);

    // Преобразуем в формат для фронтенда
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      cid: msg.cid,
      author: msg.author,
      text: msg.text,
      createdAt: msg.created_at,
    }));

    return NextResponse.json({
      ok: true,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("GET /api/support/chat/poll error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", messages: [] },
      { status: 200 }
    );
  }
}


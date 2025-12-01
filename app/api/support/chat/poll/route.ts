// app/api/support/chat/poll/route.ts
// Заглушка для API получения сообщений поддержки
// Telegram-интеграция временно отключена

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Возвращаем пустой список сообщений как заглушку
    return NextResponse.json(
      {
        ok: true,
        messages: [],
        message: "Telegram-интеграция отключена. Сообщений с сервера нет.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/support/chat/poll error:", error);
    return NextResponse.json(
      {
        ok: true,
        messages: [],
        message: "Telegram-интеграция отключена.",
      },
      { status: 200 }
    );
  }
}


// app/api/support/chat/send/route.ts
// Заглушка для API отправки сообщений поддержки
// Telegram-интеграция временно отключена

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Просто читаем тело и подтверждаем успех, ничего никуда не отправляем
    const body = await req.json().catch(() => null);

    return NextResponse.json(
      {
        ok: true,
        echo: body ?? null,
        message: "Telegram-интеграция временно отключена. Сообщение никуда не отправлено.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Support API] POST /api/support/chat/send error:", error);
    return NextResponse.json(
      {
        ok: true,
        message: "Telegram-интеграция временно отключена.",
      },
      { status: 200 }
    );
  }
}


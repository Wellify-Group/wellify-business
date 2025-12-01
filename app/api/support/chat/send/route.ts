// app/api/support/chat/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveSupportMessage } from "@/lib/support-chat";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPPORT_CHAT_ID = process.env.TELEGRAM_SUPPORT_CHAT_ID; // ид группы

if (!BOT_TOKEN) {
  console.warn("TELEGRAM_BOT_TOKEN is not set");
}
if (!SUPPORT_CHAT_ID) {
  console.warn("TELEGRAM_SUPPORT_CHAT_ID is not set");
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cid, message, name, userId, email } = body as {
      cid?: string;
      message?: string;
      name?: string | null;
      userId?: string | null;
      email?: string | null;
    };

    if (!cid || !message) {
      return NextResponse.json(
        { ok: false, error: "CID_AND_MESSAGE_REQUIRED" },
        { status: 400 }
      );
    }

    // Сохраняем сообщение пользователя через общий модуль
    const saved = await saveSupportMessage({
      cid,
      author: "user",
      text: message,
      name,
      userId,
      email,
    });

    // Если нет настроенного бота / чата - просто выходим
    if (!BOT_TOKEN || !SUPPORT_CHAT_ID) {
      return NextResponse.json({ ok: true, skippedTelegram: true, message: saved });
    }

    // Формируем "карточку" в группу
    const lines = [
      "💬 WELLIFY business SUPPORT",
      "",
      "Новый запрос с сайта",
      "",
      `🧑‍💻 Имя: ${name || "Гость сайта"}`,
      `🆔 ID пользователя: ${userId || "—"}`,
      `📧 Email: ${email || "—"}`,
      "",
      `🧩 CID: ${cid}`,
      "─────────────",
      `💬 Сообщение:`,
      message,
    ];

    const textToSend = lines.join("\n");

    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: SUPPORT_CHAT_ID,
        text: textToSend,
      }),
    });

    return NextResponse.json({ ok: true, message: saved });
  } catch (error) {
    console.error("POST /api/support/chat/send error", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}


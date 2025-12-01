// app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { addSupportMessage, SupportMessage } from "@/lib/supportStore";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPPORT_CHAT_ID = process.env.TELEGRAM_SUPPORT_CHAT_ID;

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Нас интересуют только обычные сообщения
    const message = update.message;
    if (!message || !message.chat || !message.chat.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);

    // Работаем только с нашей группой поддержки
    if (!SUPPORT_CHAT_ID || chatId !== String(SUPPORT_CHAT_ID)) {
      return NextResponse.json({ ok: true });
    }

    // Нас интересуют только ответы (reply) на "карточку"
    if (!message.reply_to_message || !message.reply_to_message.text) {
      // это просто сообщение в группе - игнорируем
      return NextResponse.json({ ok: true });
    }

    const replyToText: string = message.reply_to_message.text;
    const supportText: string | undefined = message.text;

    if (!supportText) {
      return NextResponse.json({ ok: true });
    }

    // Ищем в тексте "🧩 CID: <cid>"
    const cidMatch = replyToText.match(/CID:\s*([a-f0-9-]+)/i);
    const cid = cidMatch?.[1];

    if (!cid) {
      console.warn("WEBHOOK: CID not found in reply_to_message");
      return NextResponse.json({ ok: true });
    }

    // Сохраняем ответ оператора в store,
    // чтобы фронт получил его через /api/support/messages
    const msg: SupportMessage = {
      id: crypto.randomUUID(),
      cid,
      author: "support",
      text: supportText.trim(),
      createdAt: new Date().toISOString(),
    };

    addSupportMessage(msg);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/telegram/webhook error", error);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}


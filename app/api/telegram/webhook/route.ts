// app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveSupportMessage } from "@/lib/support-chat";

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

    // Проверяем, что есть текст ответа
    if (!supportText || !supportText.trim()) {
      return NextResponse.json({ ok: true });
    }

    // Ищем в тексте "🧩 CID: <cid>" или просто "CID: <cid>"
    const cidMatch = replyToText.match(/CID:\s*([a-f0-9-]+)/i);
    const cid = cidMatch?.[1];

    if (!cid) {
      console.warn("WEBHOOK: CID not found in reply_to_message text:", replyToText.substring(0, 100));
      return NextResponse.json({ ok: true });
    }

    // Сохраняем ответ оператора через общий модуль
    try {
      await saveSupportMessage({
        cid,
        author: "support",
        text: supportText.trim(),
        name: message.from?.first_name || message.from?.username || null,
        userId: message.from?.id ? String(message.from.id) : null,
        email: null,
      });

      console.log(`WEBHOOK: Saved support message for CID: ${cid}`);
    } catch (saveError) {
      console.error("WEBHOOK: Error saving support message:", saveError);
      // Не падаем с ошибкой - возвращаем 200 OK
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/telegram/webhook error", error);
    // ВАЖНО: вебхук никогда не должен падать с ошибкой
    // Всегда возвращаем 200 OK, чтобы Telegram не считал запрос неудачным
    return NextResponse.json({ ok: true });
  }
}


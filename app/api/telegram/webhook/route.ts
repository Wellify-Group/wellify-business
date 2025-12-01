import { NextRequest, NextResponse } from "next/server";
import { addSupportMessage } from "@/lib/supportChatStore";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat?: {
      id: number;
      type: string;
    };
    reply_to_message?: {
      message_id: number;
      text?: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: TelegramUpdate = await req.json();

    // Проверяем, что это сообщение с текстом
    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_SUPPORT_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
      console.error("Missing Telegram environment variables");
      return NextResponse.json({ ok: true });
    }

    const message = body.message;
    const chatId = message.chat?.id;
    const chatType = message.chat?.type;

    // Обработка приватного чата с ботом (/start)
    if (chatType === "private" && message.text === "/start") {
      const welcomeText = `Привет! 👋 Это служба поддержки WELLIFY business.

Напиши сюда свой вопрос – наша команда увидит его и ответит прямо в этом чате.

Если ты уже оставил сообщение на сайте в виджете поддержки, просто уточни детали здесь.`;

      try {
        await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: welcomeText,
            }),
          }
        );
      } catch (error) {
        console.error("Error sending welcome message:", error);
      }

      return NextResponse.json({ ok: true });
    }

    // Обработка сообщений в группе поддержки
    if (chatId && Number(chatId) === Number(telegramChatId)) {
      // Проверяем, что это ответ на сообщение (reply)
      if (!message.reply_to_message || !message.reply_to_message.text) {
        return NextResponse.json({ ok: true });
      }

      const replyText = message.reply_to_message.text;
      const supportText = message.text.trim();

      // Извлекаем CID из текста ответа
      // Формат: "🧩 CID: <cid>"
      const cidMatch = replyText.match(/CID:\s*([a-f0-9-]+)/i);

      if (!cidMatch || !cidMatch[1]) {
        // Если CID не найден, игнорируем апдейт
        return NextResponse.json({ ok: true });
      }

      const cid = cidMatch[1].trim();

      // Сохраняем ответ в хранилище
      try {
        await addSupportMessage({
          id: randomUUID(),
          cid,
          author: "support",
          text: supportText,
          createdAt: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error("Error saving support message:", dbError);
        return NextResponse.json(
          { ok: false, error: "STORAGE_ERROR" },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Игнорируем все остальные сообщения
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in Telegram webhook:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}


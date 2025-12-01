import { NextRequest, NextResponse } from "next/server";
import { addSupportMessage } from "@/lib/db/support";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat?: {
      id: number | string;
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
    const update: TelegramUpdate = await req.json();
    const message = update.message;

    // Проверяем, что это сообщение
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_SUPPORT_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
      console.error("Missing Telegram environment variables");
      return NextResponse.json({ ok: true });
    }

    const supportChatId = Number(telegramChatId);
    const chatId = typeof message.chat?.id === "string" 
      ? Number(message.chat.id) 
      : message.chat?.id;
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

    // ===== ОБРАБОТКА ОТВЕТА СОТРУДНИКА ПОДДЕРЖКИ =====
    // Проверяем: сообщение из группы поддержки, является ответом на карточку, имеет текст
    if (
      chatId === supportChatId &&
      message.reply_to_message &&
      message.reply_to_message.text &&
      message.text
    ) {
      const repliedText = message.reply_to_message.text;
      const supportText = message.text.trim();

      // Если у сообщения поддержки нет текста – игнорируем
      if (!supportText) {
        return NextResponse.json({ ok: true });
      }

      // Извлекаем CID из текста карточки (ищем "🧩 CID: <uuid>" или просто "CID: <uuid>")
      const cidMatch = repliedText.match(/🧩\s*CID:\s*([a-f0-9-]+)/i) || 
                       repliedText.match(/CID:\s*([a-f0-9-]+)/i);
      
      if (!cidMatch || !cidMatch[1]) {
        // CID не найден, игнорируем (чтобы не ломать вебхук)
        return NextResponse.json({ ok: true });
      }

      const cid = cidMatch[1];

      // Сохраняем сообщение от саппорта в то же хранилище
      try {
        await addSupportMessage({
          id: randomUUID(),
          cid,
          author: "support",
          text: supportText,
          createdAt: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error("Error saving support message to database:", dbError);
        // Не возвращаем ошибку, чтобы не ломать вебхук
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


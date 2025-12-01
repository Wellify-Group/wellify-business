import { NextRequest, NextResponse } from "next/server";
import { addSupportMessage } from "@/lib/supportChatStore";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

interface SendMessageRequest {
  cid: string;          // conversation id из localStorage
  message: string;      // текст от пользователя
  name?: string;        // ФИО, если есть
  userId?: string;      // внутренний ID пользователя, если есть
  email?: string;       // email, если есть
}

export async function POST(request: NextRequest) {
  try {
    // Проверка переменных окружения
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_SUPPORT_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
      console.error("Missing Telegram environment variables");
      return NextResponse.json(
        { ok: false, error: "TELEGRAM_CONFIG_MISSING" },
        { status: 500 }
      );
    }

    // Парсинг тела запроса
    const body: SendMessageRequest = await request.json();
    const { cid, message, name, userId, email } = body;

    // Валидация
    if (!cid || !message || message.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    // Формирование данных пользователя с дефолтами
    const safeName = name || "Гость сайта";
    const safeUserId = userId || "—";
    const safeEmail = email || "—";

    // Формирование текста сообщения для Telegram (без markdown, обычный текст)
    const telegramText = [
      "💬 WELLIFY business SUPPORT",
      "👤 WELLIFY business SUPPORT",
      "",
      "Новый запрос с сайта",
      "",
      `🆔 Имя: ${safeName}`,
      `🪪 ID пользователя: ${safeUserId}`,
      `✉️ Email: ${safeEmail}`,
      "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
      `🧩 CID: ${cid}`,
      "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
      "💭 Сообщение:",
      message.trim(),
    ].join("\n");

    // Отправка сообщения в Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: telegramText,
        }),
      }
    );

    const telegramData = await telegramResponse.json();

    // Проверка ответа от Telegram
    if (!telegramResponse.ok || !telegramData.ok) {
      console.error("Telegram API error:", telegramData);
      return NextResponse.json(
        { ok: false, error: "TELEGRAM_SEND_FAILED" },
        { status: 502 }
      );
    }

    // Сохранение сообщения в файловое хранилище
    try {
      await addSupportMessage({
        id: randomUUID(),
        cid,
        author: "client",
        text: message.trim(),
        createdAt: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error("Error saving message to storage:", dbError);
      // Не возвращаем ошибку, так как сообщение уже отправлено в Telegram
    }

    return NextResponse.json({ 
      ok: true 
    });
  } catch (error) {
    console.error("Error in send message route:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}


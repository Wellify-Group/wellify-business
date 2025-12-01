import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface SendMessageRequest {
  clientId: string;
  text: string;
  customerName?: string | null;
  customerId?: string | null;
  customerEmail?: string | null;
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
    const { clientId, text, customerName, customerId, customerEmail } = body;

    // Валидация
    if (!clientId || !text || text.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    // Используем clientId как conversationId (CID)
    const conversationId = clientId;

    // Формирование данных пользователя
    const name = customerName || "Гость сайта";
    const userId = customerId ? String(customerId) : "—";
    const email = customerEmail || "—";

    // Формирование текста сообщения для Telegram
    const telegramText = [
      "💬 WELLIFY business SUPPORT",
      "",
      "Новый запрос с сайта",
      "",
      `👤 Имя: ${name}`,
      `🆔 ID пользователя: ${userId}`,
      `📧 Email: ${email}`,
      "",
      `🧵 CID: ${conversationId}`,
      "───────────────",
      `💭 Сообщение:`,
      text.trim(),
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

    // Сохранение сообщения в Supabase
    const supabase = createAdminSupabaseClient();
    const { error: dbError } = await supabase.from("support_messages").insert({
      client_id: clientId,
      sender: "client",
      text: text.trim(),
    });

    if (dbError) {
      console.error("Database error:", dbError);
      // Не возвращаем ошибку, так как сообщение уже отправлено в Telegram
    }

    return NextResponse.json({ 
      ok: true, 
      conversationId 
    });
  } catch (error) {
    console.error("Error in send message route:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}


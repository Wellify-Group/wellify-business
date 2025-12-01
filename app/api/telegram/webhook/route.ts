import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { sendRealtimeBroadcast } from "@/lib/supabase/realtime";

export const dynamic = "force-dynamic";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
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

    // Проверяем, что это ответ на сообщение (reply)
    if (!body.message.reply_to_message || !body.message.reply_to_message.text) {
      return NextResponse.json({ ok: true });
    }

    const replyText = body.message.reply_to_message.text;
    const supportText = body.message.text.trim();

    // Извлекаем clientId из текста ответа
    // Формат: "💬 Новый запрос с сайта\n\nCID: <clientId>\n──────────────\n<text>"
    const cidMatch = replyText.match(/CID:\s*([^\n]+)/);
    
    if (!cidMatch || !cidMatch[1]) {
      // Если clientId не найден, просто возвращаем успех
      return NextResponse.json({ ok: true });
    }

    const clientId = cidMatch[1].trim();

    // Сохраняем сообщение в базу данных
    const supabase = createAdminSupabaseClient();
    const { error: dbError } = await supabase.from("support_messages").insert({
      client_id: clientId,
      sender: "support",
      text: supportText,
    });

    if (dbError) {
      console.error("Database error in webhook:", dbError);
      return NextResponse.json(
        { ok: false, error: "DATABASE_ERROR" },
        { status: 500 }
      );
    }

    // Отправляем событие в Realtime
    try {
      await sendRealtimeBroadcast(clientId, {
        sender: "support",
        text: supportText,
        createdAt: new Date().toISOString(),
      });
    } catch (realtimeError) {
      console.error("Realtime broadcast error:", realtimeError);
      // Не возвращаем ошибку, так как сообщение уже сохранено в БД
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in Telegram webhook:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}


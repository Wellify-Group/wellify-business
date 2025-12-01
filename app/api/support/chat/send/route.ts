// app/api/support/chat/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateSession,
  updateSessionTopicId,
  saveSupportMessage,
} from "@/lib/db-support";
import { createForumTopic, sendMessage } from "@/lib/telegram";

export const runtime = "nodejs";
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

    // Валидация
    if (!cid) {
      return NextResponse.json(
        { ok: false, error: "CID_REQUIRED" },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { ok: false, error: "EMPTY_MESSAGE" },
        { status: 400 }
      );
    }

    // Получаем или создаём сессию в Supabase
    let session = await getOrCreateSession({
      cid,
      user_name: name,
      user_id: userId,
      email,
    });

    // Если у сессии нет topic_id - создаём тему в Telegram
    if (!session.topic_id) {
      try {
        const topicName = `👤 ${name || "Гость"} — ${cid.slice(0, 8)}`;
        const topicId = await createForumTopic({ name: topicName });

        // Сохраняем topic_id в сессию
        await updateSessionTopicId(cid, topicId);
        session.topic_id = topicId;

        // Отправляем карточку клиента в тему
        const cardText =
          "Новый запрос с сайта\n\n" +
          `🧑 Имя: ${name || "Гость сайта"}\n` +
          `🆔 ID пользователя: ${userId || "—"}\n` +
          `📧 Email: ${email || "—"}\n` +
          `🧩 CID: ${cid}\n` +
          "──────────────";

        await sendMessage({
          topicId,
          text: cardText,
        });
      } catch (error) {
        console.error("Failed to create topic:", error);
        return NextResponse.json(
          { ok: false, error: "TELEGRAM_ERROR" },
          { status: 500 }
        );
      }
    }

    // Сохраняем сообщение пользователя в Supabase
    await saveSupportMessage({
      cid,
      author: "user",
      text: message.trim(),
    });

    // Отправляем сообщение пользователя в Telegram
    try {
      await sendMessage({
        topicId: session.topic_id!,
        text: message.trim(),
      });
    } catch (error) {
      console.error("Failed to send message to Telegram:", error);
      // Не падаем - сообщение уже сохранено в БД
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/support/chat/send error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}


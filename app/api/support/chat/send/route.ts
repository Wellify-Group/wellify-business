// app/api/support/chat/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getSupportStore,
  getOrCreateSession,
  appendMessage,
} from "@/lib/support-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { cid, message, name, userId, email } = await req.json();

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

    // Получить настройки Telegram
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_SUPPORT_CHAT_ID; // супергруппа с включёнными темами

    if (!token || !chatId) {
      console.error("Telegram config missing");
      return NextResponse.json(
        { ok: false, error: "TELEGRAM_CONFIG_MISSING" },
        { status: 500 }
      );
    }

    // Получить store и сессию
    const store = getSupportStore();

    const session = await getOrCreateSession({
      cid,
      userName: name,
      userId,
      email,
      topicIdCreator: async () => {
        const createRes = await fetch(
          `https://api.telegram.org/bot${token}/createForumTopic`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              name: `👤 ${name || "Гость сайта"} (${cid.slice(0, 6)})`,
            }),
          }
        );

        const createJson = await createRes.json();
        if (!createRes.ok || !createJson?.result?.message_thread_id) {
          console.error("Failed to create topic", createJson);
          throw new Error("CREATE_TOPIC_FAILED");
        }

        const topicId = createJson.result.message_thread_id as number;

        // Отправляем карточку клиента
        const cardText =
          "Новый запрос с сайта\n\n" +
          `🧑 Имя: ${name || "Гость сайта"}\n` +
          `🆔 ID пользователя: ${userId || "—"}\n` +
          `📧 Email: ${email || "—"}\n` +
          `🧩 CID: ${cid}\n` +
          "──────────────";

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            message_thread_id: topicId,
            text: cardText,
          }),
        });

        return topicId;
      },
    });

    // Отправить текст пользователя в тему
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_thread_id: session.topicId,
        text: message.trim(),
      }),
    });

    // Сохранить сообщение у нас
    appendMessage(cid, {
      id: crypto.randomUUID(),
      cid,
      author: "user",
      text: message.trim(),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/support/chat/send error", e);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

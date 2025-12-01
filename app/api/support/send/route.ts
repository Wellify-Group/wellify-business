// app/api/support/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  createSession,
  addPendingMessage,
} from "@/lib/supportSession";
import { createForumTopic, sendMessage } from "@/lib/telegram";

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

    // Получаем или создаём сессию
    let session = getSession(cid);

    if (!session) {
      // Создаём новую тему в Telegram
      const topicName = `👤 ${name || "Гость"} — ${cid.slice(0, 8)}`;
      const topicId = await createForumTopic({ name: topicName });

      // Создаём сессию
      session = createSession({
        cid,
        topicId,
        userName: name,
        userId,
        email,
      });

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
    }

    // Отправляем сообщение пользователя в Telegram
    await sendMessage({
      topicId: session.topicId,
      text: message.trim(),
    });

    // Сохраняем сообщение как pending (для истории)
    addPendingMessage(cid, {
      text: message.trim(),
      from: "user",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/support/send error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}


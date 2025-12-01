// app/api/support/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCidByTopicId, addPendingMessage, getSession } from "@/lib/supportSession";
import { getSupportChatId } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    const message = update?.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    // Игнорируем сообщения от бота
    if (message.from?.is_bot) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat?.id;
    const topicId = message.message_thread_id;

    // Работаем только с нашей супергруппой и только с сообщениями в темах
    const supportChatId = Number(getSupportChatId());
    if (!supportChatId || chatId !== supportChatId || !topicId) {
      return NextResponse.json({ ok: true });
    }

    const text: string | undefined = message.text;
    if (!text || !text.trim()) {
      return NextResponse.json({ ok: true });
    }

    // Находим cid по topicId
    const cid = getCidByTopicId(topicId);
    if (!cid) {
      // Нет привязки - возможно, это первое сообщение в теме (карточка клиента)
      // Или тема была создана вручную - игнорируем
      console.warn(`No cid found for topicId: ${topicId}`);
      return NextResponse.json({ ok: true });
    }

    // Проверяем, что это не первое сообщение (карточка клиента)
    // Если сессия только что создана и это первое сообщение после карточки - игнорируем
    const session = getSession(cid);
    if (session) {
      // Проверяем, что это не карточка клиента
      // Карточка содержит "Новый запрос с сайта" или "CID:"
      if (
        text.includes("Новый запрос с сайта") ||
        text.includes("CID:") ||
        text.includes("──────────────")
      ) {
        return NextResponse.json({ ok: true });
      }
    }

    // Сохраняем сообщение админа
    addPendingMessage(cid, {
      text: text.trim(),
      from: "admin",
      timestamp: new Date(
        (message.date ?? Math.floor(Date.now() / 1000)) * 1000
      ).toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/support/webhook error:", error);
    // Всегда возвращаем ok, чтобы Telegram не ретраил
    return NextResponse.json({ ok: true });
  }
}


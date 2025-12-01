// app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionByTopicId, saveSupportMessage } from "@/lib/db-support";
import { getSupportChatId } from "@/lib/telegram";

export const runtime = "nodejs";
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

    // Проверяем, что это не карточка клиента (первое сообщение)
    if (
      text.includes("Новый запрос с сайта") ||
      text.includes("CID:") ||
      text.includes("──────────────")
    ) {
      return NextResponse.json({ ok: true });
    }

    // Находим сессию по topic_id
    const session = await getSessionByTopicId(topicId);
    if (!session) {
      // Нет привязки - возможно, тема была создана вручную
      console.warn(`No session found for topicId: ${topicId}`);
      return NextResponse.json({ ok: true });
    }

    // Сохраняем сообщение админа в Supabase
    await saveSupportMessage({
      cid: session.cid,
      author: "support",
      text: text.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/telegram/webhook error:", error);
    // Всегда возвращаем ok, чтобы Telegram не ретраил
    return NextResponse.json({ ok: true });
  }
}

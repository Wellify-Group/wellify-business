// app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupportStore, appendMessage } from "@/lib/support-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    const message = update?.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    // игнорируем сообщения от бота
    if (message.from?.is_bot) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat?.id;
    const topicId = message.message_thread_id;

    // работаем только с нашей супергруппой и только с сообщениями в темах
    const supportChatId = Number(process.env.TELEGRAM_SUPPORT_CHAT_ID);
    if (!supportChatId || chatId !== supportChatId || !topicId) {
      return NextResponse.json({ ok: true });
    }

    const text: string | undefined = message.text;
    if (!text || !text.trim()) {
      return NextResponse.json({ ok: true });
    }

    const store = getSupportStore();
    const cid = store.topicsIndex.get(topicId);
    if (!cid) {
      // нет привязки topicId -> cid, просто залогировать и вернуть ok
      console.warn("No cid for topicId", topicId);
      return NextResponse.json({ ok: true });
    }

    appendMessage(cid, {
      id: crypto.randomUUID(),
      cid,
      author: "support",
      text: text.trim(),
      createdAt: new Date(
        (message.date ?? Math.floor(Date.now() / 1000)) * 1000
      ).toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Telegram webhook error", e);
    // Telegram важно получать ok, чтобы он не ретраил бесконечно
    return NextResponse.json({ ok: true });
  }
}

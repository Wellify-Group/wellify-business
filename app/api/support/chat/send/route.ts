// app/api/support/chat/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveSupportMessage } from "@/lib/db-support";
import { SessionManager } from "@/lib/services/SessionManager";
import { TelegramService } from "@/lib/services/TelegramService";
import { sendRealtimeBroadcast } from "@/lib/supabase/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sessionManager = new SessionManager();
const telegramService = new TelegramService();

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
      console.warn("[Support API] Missing CID in request");
      return NextResponse.json(
        { ok: false, error: "CID_REQUIRED" },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      console.warn(`[Support API] Empty message from CID: ${cid}`);
      return NextResponse.json(
        { ok: false, error: "EMPTY_MESSAGE" },
        { status: 400 }
      );
    }

    console.log(`[Support API] Processing message from CID: ${cid}`);

    // Получаем или создаём сессию
    let session = await sessionManager.getOrCreateSession({
      cid,
      user_name: name,
      user_id: userId,
      email,
    });

    // Если у сессии нет topic_id - создаём тему в Telegram
    if (!session.topic_id) {
      try {
        const topicName = `👤 ${name || "Гость"} — ${cid.slice(0, 8)}`;
        const topicId = await telegramService.createForumTopic(topicName);

        // Сохраняем topic_id в сессию
        await sessionManager.updateTopicId(cid, topicId);
        session.topic_id = topicId;

        // Отправляем карточку клиента в тему
        await telegramService.sendClientCard({
          topicId,
          name,
          userId,
          email,
          cid,
        });

        console.log(`[Support API] Created new Telegram topic ${topicId} for CID: ${cid}`);
      } catch (error) {
        console.error(`[Support API] Failed to create Telegram topic for CID ${cid}:`, error);
        return NextResponse.json(
          { ok: false, error: "TELEGRAM_ERROR" },
          { status: 500 }
        );
      }
    }

    // Сохраняем сообщение пользователя в Supabase
    const savedMessage = await saveSupportMessage({
      cid,
      author: "user",
      text: message.trim(),
    });

    // Отправляем сообщение пользователя в Telegram
    try {
      await telegramService.sendUserMessage(session.topic_id!, message.trim());
      console.log(`[Support API] Sent message to Telegram topic ${session.topic_id} for CID: ${cid}`);
    } catch (error) {
      console.error(`[Support API] Failed to send message to Telegram for CID ${cid}:`, error);
      // Не падаем - сообщение уже сохранено в БД
    }

    // Отправляем через Realtime для мгновенной доставки (если клиент подключен)
    try {
      await sendRealtimeBroadcast(cid, {
        sender: "client",
        text: message.trim(),
        createdAt: savedMessage.created_at,
      });
    } catch (error) {
      // Realtime может быть недоступен - это нормально, будет polling fallback
      console.log(`[Support API] Realtime broadcast failed for CID ${cid} (will use polling):`, error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Support API] POST /api/support/chat/send error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}


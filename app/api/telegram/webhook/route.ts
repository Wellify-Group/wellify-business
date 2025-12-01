// app/api/telegram/webhook/route.ts
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
    const update = await req.json();

    // Обрабатываем только сообщения (игнорируем другие типы обновлений)
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
    const supportChatId = Number(telegramService.getSupportChatId());
    if (!supportChatId || chatId !== supportChatId || !topicId) {
      // Логируем для отладки, но не падаем
      if (chatId && chatId !== supportChatId) {
        console.log(`[Telegram Webhook] Message from different chat: ${chatId}, expected: ${supportChatId}`);
      }
      if (!topicId) {
        console.log("[Telegram Webhook] Message without topic_id (not in a forum topic)");
      }
      return NextResponse.json({ ok: true });
    }

    const text: string | undefined = message.text;
    if (!text || !text.trim()) {
      // Игнорируем сообщения без текста (стикеры, фото и т.д.)
      return NextResponse.json({ ok: true });
    }

    // Проверяем, что это не системное сообщение от бота (карточка клиента)
    // Карточка клиента отправляется ботом при создании темы
    if (
      text.includes("Новый запрос с сайта") ||
      text.includes("🆕") ||
      (text.includes("CID:") && text.includes("──────────────"))
    ) {
      return NextResponse.json({ ok: true });
    }

    // Находим сессию по topic_id
    const session = await sessionManager.getSessionByTopicId(topicId);
    if (!session) {
      // Нет привязки - возможно, тема была создана вручную или сессия не была создана
      console.warn(`[Telegram Webhook] No session found for topicId: ${topicId}. Message: "${text.substring(0, 50)}..."`);
      return NextResponse.json({ ok: true });
    }

    // Сохраняем сообщение админа в Supabase
    const savedMessage = await saveSupportMessage({
      cid: session.cid,
      author: "support",
      text: text.trim(),
    });

    console.log(`[Telegram Webhook] Support message saved for CID: ${session.cid}, topicId: ${topicId}`);

    // Отправляем через Realtime для мгновенной доставки (если клиент подключен)
    try {
      await sendRealtimeBroadcast(session.cid, {
        sender: "support",
        text: text.trim(),
        createdAt: savedMessage.created_at,
      });
      console.log(`[Telegram Webhook] Realtime broadcast sent for CID: ${session.cid}`);
    } catch (error) {
      // Realtime может быть недоступен - это нормально, будет polling fallback
      console.log(`[Telegram Webhook] Realtime broadcast failed for CID ${session.cid} (will use polling):`, error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] POST /api/telegram/webhook error:", error);
    // Всегда возвращаем ok, чтобы Telegram не ретраил
    return NextResponse.json({ ok: true });
  }
}

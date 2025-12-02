// app/api/support/chat/send/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendSupportMessageToTelegram } from '@/lib/telegram/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { cid, message, name, email } = await req.json();

    if (!cid || !message || !message.trim()) {
      return NextResponse.json(
        { ok: false, error: 'BAD_REQUEST' },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();

    // 1. Проверяем, есть ли сессия
    const { data: session, error: sessionError } = await supabase
      .from('support_sessions')
      .select('cid')
      .eq('cid', cid)
      .maybeSingle();

    if (sessionError) {
      console.error('POST /api/support/chat/send session select error', sessionError);
      throw sessionError;
    }

    // 2. Если сессии нет - создаём
    if (!session) {
      const { error: insertSessionError } = await supabase
        .from('support_sessions')
        .insert({
          cid,
          user_name: name ?? null,
          user_email: email ?? null,
          user_id: null,
        });

      if (insertSessionError) {
        console.error('POST /api/support/chat/send session insert error', insertSessionError);
        throw insertSessionError;
      }
    }

    // 3. Сохраняем сообщение пользователя
    const { error: insertMsgError } = await supabase
      .from('support_messages')
      .insert({
        cid,
        direction: 'user',
        text: message,
      });

    if (insertMsgError) {
      console.error('POST /api/support/chat/send message insert error', insertMsgError);
      throw insertMsgError;
    }

    // 4. Отправляем в Telegram и сохраняем связь message_id <-> cid
    let telegramMessageId: number | null = null;

    try {
      const { messageId } = await sendSupportMessageToTelegram({
        cid,
        text: message,
        name,
        email,
        userId: null,
      });

      telegramMessageId = messageId;

      const { error: threadError } = await supabase
        .from('support_telegram_threads')
        .insert({
          cid,
          telegram_message_id: messageId,
        });

      if (threadError) {
        // не критично для пользователя, просто логируем
        console.error('support_telegram_threads insert error:', threadError);
      }
    } catch (telegramError) {
      console.error('POST /api/support/chat/send telegram error', telegramError);
      // пользователю всё равно отвечаем ok, чтобы не ломать UX
      // сообщение уже сохранено в БД
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/support/chat/send REAL ERROR', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

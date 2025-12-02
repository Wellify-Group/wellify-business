// app/api/support/chat/send/route.ts
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendSupportMessageToTelegram } from '@/lib/telegram/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let { cid, message, name, email, userId } = body as {
      cid?: string;
      message?: string;
      name?: string;
      email?: string;
      userId?: string;
    };

    const text = (message ?? '').trim();
    if (!text) {
      return NextResponse.json(
        { ok: false, error: 'EMPTY_MESSAGE' },
        { status: 400 },
      );
    }

    if (!cid) {
      cid = randomUUID();
    }

    const supabase = await createServerSupabaseClient();

    // upsert session
    const { error: sessionError } = await supabase
      .from('support_sessions')
      .upsert(
        {
          cid,
          user_name: name ?? null,
          user_email: email ?? null,
          user_id: userId ?? null,
        },
        { onConflict: 'cid' },
      );

    if (sessionError) {
      console.error('support_sessions upsert error:', sessionError);
      throw sessionError;
    }

    // записываем сообщение пользователя в БД
    const { error: insertMessageError } = await supabase
      .from('support_messages')
      .insert({
        cid,
        direction: 'user',
        text,
      });

    if (insertMessageError) {
      console.error('support_messages insert error:', insertMessageError);
      throw insertMessageError;
    }

    // отправляем в Telegram и сохраняем связь message_id <-> cid
    let telegramMessageId: number | null = null;

    try {
      const { messageId } = await sendSupportMessageToTelegram({
        cid,
        text,
        name,
        email,
        userId,
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
      console.error('Error sending message to Telegram:', telegramError);
      // пользователю всё равно отвечаем ok, чтобы не ломать UX
    }

    return NextResponse.json({
      ok: true,
      cid,
      telegramMessageId,
    });
  } catch (error) {
    console.error('POST /api/support/chat/send REAL ERROR:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

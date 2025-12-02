// app/api/support/chat/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isEmptyMessage(text: unknown): boolean {
  if (typeof text !== 'string') return true;
  return text.trim().length === 0;
}

// простая отправка в один Telegram-чат
async function forwardToTelegram(text: string, cid: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_SUPPORT_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      '[support/chat/send] Telegram env not set: TELEGRAM_BOT_TOKEN / TELEGRAM_SUPPORT_CHAT_ID'
    );
    return;
  }

  const prefix = `#${cid.slice(0, 8)} `;
  const fullText = `${prefix}${text}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: fullText,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || (data && data.ok === false)) {
      console.error('[support/chat/send] Telegram send error', {
        status: res.status,
        data,
      });
    }
  } catch (e) {
    console.error('[support/chat/send] Telegram send exception', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = (await req.json().catch(() => null)) as
      | { cid?: string; text?: string }
      | null;

    const cid = body?.cid ?? '';
    const text = body?.text ?? '';

    if (!cid) {
      // фронт в этом случае сам пересоздаёт сессию
      return NextResponse.json(
        { ok: false, error: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (isEmptyMessage(text)) {
      return NextResponse.json(
        { ok: false, error: 'EMPTY_MESSAGE' },
        { status: 400 }
      );
    }

    // находим сессию по cid
    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from('support_sessions')
      .select('id, status, cid')
      .eq('cid', cid)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { ok: false, error: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // создаём сообщение в БД
    const { error: msgError } = await supabase.from('support_messages').insert({
      session_id: session.id,
      author: 'user',
      text,
    });

    if (msgError) {
      console.error('[support/chat/send] message insert error', msgError);
      return NextResponse.json(
        { ok: false, error: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // обновляем статус сессии
    if (session.status === 'new') {
      await supabase
        .from('support_sessions')
        .update({ status: 'in_progress' })
        .eq('id', session.id);
    }

    // НЕ блокируем ответ пользователю, даже если Telegram упал
    forwardToTelegram(text, session.cid).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[support/chat/send] unexpected', e);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

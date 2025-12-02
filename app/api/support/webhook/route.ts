// app/api/support/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TgUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface TgMessage {
  message_id: number;
  chat: { id: number; type: string; title?: string };
  text?: string;
  from?: TgUser;
  date: number;
  reply_to_message?: TgMessage;
}

interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  channel_post?: TgMessage;
}

// достаём префикс сессии и текст ответа саппорта
function extractSessionPrefixAndText(msg: TgMessage): { prefix: string; text: string } | null {
  const answerText = (msg.text ?? '').trim();
  if (!answerText) return null;

  // ищем #XXXXXXXX в тексте исходного сообщения бота
  const sourceText = msg.reply_to_message?.text ?? '';
  if (!sourceText) return null;

  const match = sourceText.match(/#([0-9a-fA-F]{8})/);
  if (!match) return null;

  const prefix = match[1];
  return { prefix, text: answerText };
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const supportChatId = process.env.TELEGRAM_SUPPORT_CHAT_ID;

    if (!token || !supportChatId) {
      console.warn('[support/webhook] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_SUPPORT_CHAT_ID');
      // Telegram важно получить 200, чтобы не ретраить бесконечно
      return NextResponse.json({ ok: true });
    }

    const update = (await req.json().catch(() => null)) as TgUpdate | null;
    if (!update) {
      return NextResponse.json({ ok: true });
    }

    const msg = update.message ?? update.channel_post;
    if (!msg) {
      return NextResponse.json({ ok: true });
    }

    // игнорируем другие чаты
    if (msg.chat.id.toString() !== supportChatId) {
      return NextResponse.json({ ok: true });
    }

    const extracted = extractSessionPrefixAndText(msg);
    if (!extracted) {
      // нет префикса или текста - ничего не делаем
      return NextResponse.json({ ok: true });
    }

    const { prefix, text } = extracted;

    const supabase = await createServerSupabaseClient();

    // ищем сессию по префиксу cid (первые 8 символов)
    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from('support_sessions')
      .select('id, cid')
      .ilike('cid', `${prefix}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      console.error('[support/webhook] session not found for prefix', prefix, sessionError);
      return NextResponse.json({ ok: true });
    }

    const displayName =
      msg.from?.username ||
      [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') ||
      'Support';

    const finalText = `${displayName}: ${text}`;

    const { error: insertError } = await supabase.from('support_messages').insert({
      session_id: session.id,
      author: 'support',
      text: finalText,
    });

    if (insertError) {
      console.error('[support/webhook] insert message error', insertError);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[support/webhook] unexpected', e);
    // всегда 200, чтобы Telegram не засыпал тебя ретраями
    return NextResponse.json({ ok: true });
  }
}

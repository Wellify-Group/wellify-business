// app/api/telegram/webhook/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const TELEGRAM_SUPPORT_CHAT_ID = process.env.TELEGRAM_SUPPORT_CHAT_ID;

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const update = (await req.json()) as any;

    const message = update?.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    // фильтр по чату
    const chatId = message.chat?.id;
    if (!TELEGRAM_SUPPORT_CHAT_ID || String(chatId) !== TELEGRAM_SUPPORT_CHAT_ID) {
      return NextResponse.json({ ok: true });
    }

    // игнорируем бота
    if (message.from?.is_bot) {
      return NextResponse.json({ ok: true });
    }

    const text: string = (message.text ?? '').trim();
    if (!text) {
      return NextResponse.json({ ok: true });
    }

    const replyTo = message.reply_to_message;
    if (!replyTo) {
      // нас интересуют только ответы на сообщения бота
      return NextResponse.json({ ok: true });
    }

    const repliedMessageId: number | undefined = replyTo.message_id;
    if (!repliedMessageId) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createServerSupabaseClient();

    // Находим cid по telegram_message_id
    const { data: thread, error: threadError } = await supabase
      .from('support_telegram_threads')
      .select('cid')
      .eq('telegram_message_id', repliedMessageId)
      .maybeSingle();

    if (threadError) {
      console.error('support_telegram_threads select error:', threadError);
      throw threadError;
    }

    if (!thread || !thread.cid) {
      // Нет сессии - просто выходим
      return NextResponse.json({ ok: true });
    }

    const cid = thread.cid as string;

    // записываем сообщение админа
    const { error: insertError } = await supabase
      .from('support_messages')
      .insert({
        cid,
        direction: 'admin',
        text,
      });

    if (insertError) {
      console.error('support_messages insert (admin) error:', insertError);
      throw insertError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/telegram/webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  // простой healthcheck для debug
  return NextResponse.json({ ok: true });
}


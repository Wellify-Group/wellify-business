// app/api/support/messages/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cid = url.searchParams.get('cid');

  if (!cid) {
    return NextResponse.json(
      { ok: false, error: 'NO_CID' },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Проверяем, существует ли сессия
    const { data: session, error: sessionError } = await supabase
      .from('support_sessions')
      .select('cid')
      .eq('cid', cid)
      .maybeSingle();

    if (sessionError) {
      console.error('GET /api/support/messages session error', sessionError);
      return NextResponse.json(
        { ok: false, error: 'INTERNAL_ERROR' },
        { status: 500 },
      );
    }

    // Если сессии нет - возвращаем пустой массив (не ошибка)
    // Важно: возвращаем 200, а не 404
    if (!session) {
      return NextResponse.json(
        { ok: true, messages: [] },
        { status: 200 },
      );
    }

    // Если сессия есть - получаем сообщения
    const { data: messages, error: msgError } = await supabase
      .from('support_messages')
      .select('*')
      .eq('cid', cid)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('GET /api/support/messages messages error', msgError);
      return NextResponse.json(
        { ok: false, error: 'INTERNAL_ERROR' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        messages: (messages ?? []).map((m) => ({
          id: m.id,
          cid: m.cid,
          author: m.direction === 'user' ? 'user' : 'support',
          text: m.text,
          createdAt: m.created_at,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/support/messages REAL ERROR', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}


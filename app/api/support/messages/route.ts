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
      { ok: false, error: 'CID_REQUIRED' },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Проверяем, что сессия существует
    const { data: session, error: sessionError } = await supabase
      .from('support_sessions')
      .select('cid')
      .eq('cid', cid)
      .maybeSingle();

    if (sessionError) {
      console.error('support_sessions select error:', sessionError);
      throw sessionError;
    }

    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'SESSION_NOT_FOUND' },
        { status: 404 },
      );
    }

    const { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select('id, cid, direction, text, created_at')
      .eq('cid', cid)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('support_messages select error:', messagesError);
      throw messagesError;
    }

    return NextResponse.json({
      ok: true,
      messages: (messages ?? []).map((m) => ({
        id: m.id,
        cid: m.cid,
        author: m.direction === 'user' ? 'user' : 'support',
        text: m.text,
        createdAt: m.created_at,
      })),
    });
  } catch (error) {
    console.error('GET /api/support/messages REAL ERROR:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}


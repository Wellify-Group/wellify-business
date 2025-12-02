// app/api/support/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(req.url)
    const cid = searchParams.get('cid')

    // нет cid → считать сессию отсутствующей
    if (!cid) {
      return NextResponse.json(
        { ok: false, error: 'SESSION_NOT_FOUND', messages: [] },
        { status: 404 }
      )
    }

    // проверяем существование сессии по cid
    const { data: session, error: sessionError } = await supabase
      .from('support_sessions')
      .select('cid')
      .eq('cid', cid)
      .maybeSingle()

    if (sessionError || !session) {
      return NextResponse.json(
        { ok: false, error: 'SESSION_NOT_FOUND', messages: [] },
        { status: 404 }
      )
    }

    // загружаем сообщения по session_cid
    const { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select('id, author, text, created_at')
      .eq('session_cid', cid)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('support:messages error', messagesError)
      return NextResponse.json(
        { ok: false, error: 'INTERNAL_ERROR', messages: [] },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      messages:
        messages?.map((m) => ({
          id: m.id,
          author: m.author,
          text: m.text,
          createdAt: m.created_at,
        })) ?? [],
    })
  } catch (e) {
    console.error('support:messages unexpected', e)
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', messages: [] },
      { status: 500 }
    )
  }
}

// app/api/support/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isEmptyMessage(text: unknown): boolean {
  if (typeof text !== 'string') return true
  return text.trim().length === 0
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = (await req.json().catch(() => null)) as
      | { cid?: string; text?: string }
      | null

    const cid = body?.cid ?? ''
    const text = body?.text ?? ''

    if (!cid) {
      return NextResponse.json(
        { ok: false, error: 'SESSION_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (isEmptyMessage(text)) {
      return NextResponse.json(
        { ok: false, error: 'EMPTY_MESSAGE' },
        { status: 400 }
      )
    }

    // проверяем существование сессии по cid
    const { data: session, error: sessionError } = await supabase
      .from('support_sessions')
      .select('cid, status')
      .eq('cid', cid)
      .maybeSingle()

    if (sessionError || !session) {
      return NextResponse.json(
        { ok: false, error: 'SESSION_NOT_FOUND' },
        { status: 404 }
      )
    }

    // создаём сообщение, привязка по session_cid
    const { error: msgError } = await supabase.from('support_messages').insert({
      session_cid: cid,
      author: 'user',
      text,
    })

    if (msgError) {
      console.error('support:send message error', msgError)
      return NextResponse.json(
        { ok: false, error: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }

    // если сессия была "new" - помечаем как "in_progress"
    if (session.status === 'new') {
      await supabase
        .from('support_sessions')
        .update({ status: 'in_progress' })
        .eq('cid', cid)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('support:send unexpected', e)
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

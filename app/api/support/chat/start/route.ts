// app/api/support/chat/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type StartBody = {
  userName?: string | null
  userEmail?: string | null
  userId?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const json = (await req.json().catch(() => ({}))) as StartBody
    const userName = json.userName ?? null
    const userEmail = json.userEmail ?? null
    const userId = json.userId ?? null

    const supabase = await createServerSupabaseClient()

    // Генерируем новый cid
    const cid = crypto.randomUUID()

    // Создаём новую сессию в БД
    const { error: sessionError } = await supabase
      .from('support_sessions')
      .insert({
        cid,
        user_name: userName,
        user_email: userEmail,
        user_id: userId,
      })

    if (sessionError) {
      console.error('support_sessions insert error:', sessionError)
      return NextResponse.json(
        { ok: false, error: 'INTERNAL_ERROR' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, cid }, { status: 200 })
  } catch (error) {
    console.error('POST /api/support/chat/start REAL ERROR:', error)
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}


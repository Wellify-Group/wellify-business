// app/api/support/chat/send/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_SUPPORT_CHAT_ID = process.env.TELEGRAM_SUPPORT_CHAT_ID

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SendBody = {
  cid?: string
  text?: string
  userName?: string | null
  userEmail?: string | null
}

async function sendToTelegram(params: {
  cid: string
  text: string
  userName?: string | null
  userEmail?: string | null
  replyToMessageId?: number | null
}) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_SUPPORT_CHAT_ID) {
    console.error('Telegram env missing')
    return
  }

  const { cid, text, userName, userEmail, replyToMessageId } = params

  const messageLines = [
    '🟦 Новое обращение в поддержку',
    `CID: ${cid}`,
    userName ? `Имя: ${userName}` : null,
    userEmail ? `Email: ${userEmail}` : null,
    '',
    text,
  ].filter(Boolean)

  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

  const body: any = {
    chat_id: TELEGRAM_SUPPORT_CHAT_ID,
    text: messageLines.join('\n'),
  }

  if (replyToMessageId) {
    body.reply_to_message_id = replyToMessageId
  }

  const res = await fetch(telegramUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok || !data?.ok) {
    console.error('Telegram sendMessage error:', { status: res.status, data })
    return
  }

  return data.result as { message_id?: number }
}

export async function POST(req: Request) {
  try {
    const json = (await req.json().catch(() => ({}))) as SendBody
    const rawText = json.text ?? ''
    const text = rawText.trim()
    const userName = json.userName ?? null
    const userEmail = json.userEmail ?? null

    if (!text) {
      return NextResponse.json(
        { ok: false, error: 'EMPTY_MESSAGE' },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabaseClient()

    let cid = json.cid?.trim() || ''

    // 1) Если cid нет - создаём новую сессию
    if (!cid) {
      cid = crypto.randomUUID()

      const { error: sessionError } = await supabase
        .from('support_sessions')
        .insert({
          cid,
          user_name: userName,
          user_email: userEmail,
          user_id: null,
        })

      if (sessionError) {
        console.error('support_sessions insert error:', sessionError)
        throw sessionError
      }
    } else {
      // Проверяем, что такая сессия вообще существует
      const { data: existing, error: checkError } = await supabase
        .from('support_sessions')
        .select('cid')
        .eq('cid', cid)
        .maybeSingle()

      if (checkError) {
        console.error('support_sessions check error:', checkError)
        throw checkError
      }

      if (!existing) {
        console.error('SESSION_NOT_FOUND for cid:', cid)
        return NextResponse.json(
          { ok: false, error: 'SESSION_NOT_FOUND' },
          { status: 404 },
        )
      }
    }

    // 2) Пишем сообщение пользователя в support_messages
    const { error: messageError } = await supabase.from('support_messages').insert({
      cid,
      direction: 'user',
      text,
    })

    if (messageError) {
      console.error('support_messages insert (user) error:', messageError)
      throw messageError
    }

    // 3) Пытаемся найти основной telegram-thread для этой сессии
    let replyToMessageId: number | null = null

    const { data: thread, error: threadError } = await supabase
      .from('support_telegram_threads')
      .select('telegram_message_id')
      .eq('cid', cid)
      .maybeSingle()

    if (threadError) {
      console.error('support_telegram_threads select error:', threadError)
      // не падаем, просто лог
    } else if (thread?.telegram_message_id) {
      replyToMessageId = thread.telegram_message_id as number
    }

    // 4) Шлём в Telegram
    try {
      const result = await sendToTelegram({
        cid,
        text,
        userName,
        userEmail,
        replyToMessageId,
      })

      // если это самое первое сообщение по сессии - сохраняем thread
      if (!replyToMessageId && result?.message_id) {
        const { error: threadInsertError } = await supabase
          .from('support_telegram_threads')
          .insert({
            cid,
            telegram_message_id: result.message_id,
          })

        if (threadInsertError) {
          console.error(
            'support_telegram_threads insert error:',
            threadInsertError,
          )
        }
      }
    } catch (telegramError) {
      console.error('Telegram send (non-fatal) error:', telegramError)
      // важно: не кидаем дальше, чтобы не ломать фронт
    }

    return NextResponse.json({ ok: true, cid })
  } catch (error) {
    console.error('POST /api/support/chat/send REAL ERROR:', error)
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}

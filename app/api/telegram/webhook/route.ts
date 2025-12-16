// app/api/telegram/webhook/route.ts
// Webhook endpoint для Telegram бота на Railway
// Этот endpoint проксирует запросы к отдельному Telegram bot сервису на Railway
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/telegram/webhook
 * Проксирует webhook запросы от Telegram к боту на Railway
 * 
 * ВАЖНО: Реальный Telegram bot должен работать на Railway как отдельный сервис
 * Этот endpoint используется только для проксирования, если бот не может принимать прямые webhook
 */
export async function POST(request: NextRequest) {
  try {
    // TELEGRAM_API_URL - server-only variable, no fallback to NEXT_PUBLIC
    const telegramApiUrl = process.env.TELEGRAM_API_URL;
    
    if (!telegramApiUrl) {
      console.error('[telegram/webhook] TELEGRAM_API_URL not configured');
      return NextResponse.json(
        { ok: false, error: 'Telegram bot service not configured: TELEGRAM_API_URL is not set' },
        { status: 500 }
      );
    }

    // Читаем тело запроса
    const rawBody = await request.text();
    
    // Проксируем запрос к Railway боту
    const response = await fetch(`${telegramApiUrl}/telegram/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: rawBody,
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[telegram/webhook] Error proxying webhook:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/telegram/webhook
 * Healthcheck endpoint для проверки доступности
 */
export async function GET() {
  return NextResponse.json({ 
    ok: true,
    service: 'telegram-webhook-proxy',
    note: 'This endpoint proxies requests to Railway Telegram bot service'
  });
}


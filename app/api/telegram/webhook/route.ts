// app/api/telegram/webhook/route.ts
// Заглушка для будущих задач - не содержит кода Telegram-бота
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  // Заглушка для будущих задач
  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Healthcheck endpoint
  return NextResponse.json({ ok: true });
}


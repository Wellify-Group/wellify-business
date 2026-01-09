// app/api/telegram/session-status/[sessionToken]/route.ts

import { NextRequest, NextResponse } from 'next/server';

// TELEGRAM_API_URL - server-only variable, no fallback to NEXT_PUBLIC
const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL;

// !!! КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ОТКЛЮЧАЕМ КЭШИРОВАНИЕ !!!
export const dynamic = "force-dynamic"; 
export const runtime = "nodejs"; // Опционально, но лучше добавить

export async function GET(
    request: NextRequest,
    { params }: { params: { sessionToken: string } }
) {
    if (!TELEGRAM_API_URL) {
        return NextResponse.json(
            { error: "Configuration Error: TELEGRAM_API_URL is not set" },
            { status: 500 }
        );
    }

    const { sessionToken } = params;

    try {
        // Делаем прямой запрос к бэкенду Telegram-бота на Render
        const resp = await fetch(`${TELEGRAM_API_URL}/telegram/session-status/${sessionToken}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            // !!! ДОПОЛНИТЕЛЬНОЕ ИСПРАВЛЕНИЕ: УБРАТЬ CACHE (Fetch API) !!!
            cache: 'no-store',
        });

        // Получаем ответ от Render
        const json = await resp.json();
        
        // Передаем ответ обратно на фронт
        return NextResponse.json(json, { status: resp.status });

    } catch (e) {
        console.error("API Proxy Error:", e);
        return NextResponse.json(
            { error: "Internal Proxy Error" },
            { status: 500 }
        );
    }
}
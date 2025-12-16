// app/api/telegram/session-status/[sessionToken]/route.ts

import { serverConfig } from '@/lib/config/serverConfig.server';

// URL бота из .env (серверная переменная)
const TELEGRAM_API_URL = serverConfig.telegramApiUrl || process.env.TELEGRAM_API_URL;

// !!! КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ОТКЛЮЧАЕМ КЭШИРОВАНИЕ !!!
export const dynamic = "force-dynamic"; 
export const runtime = "nodejs"; // Опционально, но лучше добавить

export async function GET(request: Request, { params }: { params: { sessionToken: string } }) {
    if (!TELEGRAM_API_URL) {
        return new Response(JSON.stringify({ error: "Configuration Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { sessionToken } = params;

    try {
        // Делаем прямой запрос к бэкенду Telegram-бота на Railway
        const resp = await fetch(`${TELEGRAM_API_URL}/telegram/session-status/${sessionToken}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            // !!! ДОПОЛНИТЕЛЬНОЕ ИСПРАВЛЕНИЕ: УБРАТЬ CACHE (Fetch API) !!!
            cache: 'no-store',
        });

        // Получаем ответ от Railway
        const json = await resp.json();
        
        // Передаем ответ обратно на фронт
        return new Response(JSON.stringify(json), {
            status: resp.status,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (e) {
        console.error("API Proxy Error:", e);
        return new Response(JSON.stringify({ error: "Internal Proxy Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
// app/api/telegram/link-session/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TELEGRAM_API_URL - server-only variable, no fallback to NEXT_PUBLIC
const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL;

export async function POST(request: NextRequest) {
    if (!TELEGRAM_API_URL) {
        return NextResponse.json(
            { error: "Configuration Error: TELEGRAM_API_URL is not set" },
            { status: 500 }
        );
    }

    try {
        // !!! ИСПРАВЛЕНИЕ 502: Безопасное чтение и пересылка тела запроса !!!
        // 1. Читаем тело как сырой текст, чтобы избежать проблем с request.json()
        const rawBody = await request.text();

        // 2. Делаем прямой запрос к бэкенду Telegram-бота на Render
        const resp = await fetch(`${TELEGRAM_API_URL}/telegram/link-session`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                // НЕ ПЕРЕСЫЛАЕМ 'Origin' и прочее, чтобы избежать CORS на Render
            },
            body: rawBody, // Отправляем сырое тело, как получили
        });

        // Получаем ответ от Render
        // При ошибке 502/500 тело может быть невалидным JSON, поэтому используем try/catch
        let json;
        try {
            json = await resp.json();
        } catch (e) {
            // Если Render вернул не-JSON (например, HTML-страницу ошибки 502)
            console.error("Render responded with non-JSON body (likely a crash or 502 HTML):", await resp.text());
            
            // Если код 502, выбрасываем ошибку с нашим текстом, но сохраняем код
            if (resp.status === 502) {
                return NextResponse.json(
                    { error: `Не удалось создать сессию Telegram. Код ошибки: 502. Попробуйте позже.` },
                    { status: 502 }
                );
            }
            // Для всех остальных ошибок
            return NextResponse.json(
                { error: `Прокси-ошибка: ${resp.status}` },
                { status: resp.status }
            );
        }
        
        // Передаем ответ обратно на фронт
        return NextResponse.json(json, { status: resp.status });

    } catch (e) {
        console.error("API Proxy Error:", e);
        // Эта ошибка возникает, если Next.js не смог достучаться до Render
        return NextResponse.json(
            { error: "Internal Proxy Error: Failed to connect to Render" },
            { status: 500 }
        );
    }
}
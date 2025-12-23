// app/api/telegram/create-session/route.ts

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
        
        console.log('[telegram/create-session] Request body:', rawBody);
        console.log('[telegram/create-session] TELEGRAM_API_URL:', TELEGRAM_API_URL);

        // 2. Делаем прямой запрос к бэкенду Telegram-бота на Railway
        // Используем /telegram/create-session согласно INTERNAL_RULES.md
        const telegramUrl = `${TELEGRAM_API_URL}/telegram/create-session`;
        console.log('[telegram/create-session] Fetching:', telegramUrl);
        
        const resp = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                // НЕ ПЕРЕСЫЛАЕМ 'Origin' и прочее, чтобы избежать CORS на Railway
            },
            body: rawBody, // Отправляем сырое тело, как получили
        });

        console.log('[telegram/create-session] Railway response status:', resp.status);
        console.log('[telegram/create-session] Railway response headers:', Object.fromEntries(resp.headers.entries()));

        // Получаем ответ от Railway
        // При ошибке 502/500 тело может быть невалидным JSON, поэтому используем try/catch
        let json;
        let responseText: string;
        try {
            responseText = await resp.text();
            console.log('[telegram/create-session] Railway response body:', responseText);
            json = JSON.parse(responseText);
        } catch (e) {
            // Если Railway вернул не-JSON (например, HTML-страницу ошибки 502)
            console.error('[telegram/create-session] Railway responded with non-JSON body:', responseText || 'No response text');
            console.error('[telegram/create-session] Parse error:', e);
            
            // Если код 502, выбрасываем ошибку с нашим текстом, но сохраняем код
            if (resp.status === 502) {
                return NextResponse.json(
                    { error: `Сервис Telegram бота недоступен (502). Проверьте статус сервиса на Railway.` },
                    { status: 502 }
                );
            }
            
            if (resp.status === 500) {
                return NextResponse.json(
                    { error: `Ошибка на сервере Telegram бота (500). Проверьте логи Railway сервиса.` },
                    { status: 500 }
                );
            }
            
            // Для всех остальных ошибок
            return NextResponse.json(
                { error: `Ошибка при подключении к Telegram боту. Код: ${resp.status}` },
                { status: resp.status }
            );
        }
        
        // Если Railway вернул ошибку в JSON
        if (!resp.ok && json.error) {
            console.error('[telegram/create-session] Railway error response:', json);
            return NextResponse.json(
                { error: json.error || `Ошибка Telegram бота: ${resp.status}` },
                { status: resp.status }
            );
        }
        
        // Передаем ответ обратно на фронт
        return NextResponse.json(json, { status: resp.status });

    } catch (e: any) {
        console.error('[telegram/create-session] API Proxy Error:', e);
        console.error('[telegram/create-session] Error message:', e?.message);
        console.error('[telegram/create-session] Error stack:', e?.stack);
        
        // Эта ошибка возникает, если Next.js не смог достучаться до Railway
        return NextResponse.json(
            { 
                error: "Не удалось подключиться к сервису Telegram бота. Проверьте, что сервис запущен на Railway и переменная TELEGRAM_API_URL настроена правильно.",
                details: e?.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}


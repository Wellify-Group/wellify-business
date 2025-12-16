// app/api/telegram/link-session/route.ts

import { serverConfig } from '@/lib/config/serverConfig.server';

// URL бота из .env (серверная переменная)
const TELEGRAM_API_URL = serverConfig.telegramApiUrl || process.env.TELEGRAM_API_URL;

export async function POST(request: Request) {
    if (!TELEGRAM_API_URL) {
        return new Response(JSON.stringify({ error: "Configuration Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // !!! ИСПРАВЛЕНИЕ 502: Безопасное чтение и пересылка тела запроса !!!
        // 1. Читаем тело как сырой текст, чтобы избежать проблем с request.json()
        const rawBody = await request.text();

        // 2. Делаем прямой запрос к бэкенду Telegram-бота на Railway
        const resp = await fetch(`${TELEGRAM_API_URL}/telegram/link-session`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                // НЕ ПЕРЕСЫЛАЕМ 'Origin' и прочее, чтобы избежать CORS на Railway
            },
            body: rawBody, // Отправляем сырое тело, как получили
        });

        // Получаем ответ от Railway
        // При ошибке 502/500 тело может быть невалидным JSON, поэтому используем try/catch
        let json;
        try {
            json = await resp.json();
        } catch (e) {
            // Если Railway вернул не-JSON (например, HTML-страницу ошибки 502)
            console.error("Railway responded with non-JSON body (likely a crash or 502 HTML):", await resp.text());
            
            // Если код 502, выбрасываем ошибку с нашим текстом, но сохраняем код
            if (resp.status === 502) {
                return new Response(JSON.stringify({ error: `Не удалось создать сессию Telegram. Код ошибки: 502. Попробуйте позже.` }), {
                    status: 502,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            // Для всех остальных ошибок
            return new Response(JSON.stringify({ error: `Прокси-ошибка: ${resp.status}` }), {
                status: resp.status,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // Передаем ответ обратно на фронт
        return new Response(JSON.stringify(json), {
            status: resp.status,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (e) {
        console.error("API Proxy Error:", e);
        // Эта ошибка возникает, если Next.js не смог достучаться до Railway
        return new Response(JSON.stringify({ error: "Internal Proxy Error: Failed to connect to Railway" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
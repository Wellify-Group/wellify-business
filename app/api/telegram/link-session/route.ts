// app/api/telegram/link-session/route.ts

// URL бота из .env
const TELEGRAM_API_URL = process.env.NEXT_PUBLIC_TELEGRAM_API_URL;

export async function POST(request: Request) {
    if (!TELEGRAM_API_URL) {
        return new Response(JSON.stringify({ error: "Configuration Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // Получаем данные, которые фронт отправил в этот прокси-маршрут
        const body = await request.json();

        // Делаем прямой запрос к бэкенду Telegram-бота на Railway
        const resp = await fetch(`${TELEGRAM_API_URL}/telegram/link-session`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
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
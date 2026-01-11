// app/api/telegram/create-session/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TELEGRAM_API_URL - server-only variable, no fallback to NEXT_PUBLIC
const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL;

export async function POST(request: NextRequest) {
    console.log('[telegram/create-session] ========== START REQUEST ==========');
    console.log('[telegram/create-session] NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('[telegram/create-session] RENDER_ENV:', process.env.RENDER_ENV || 'not set');
    console.log('[telegram/create-session] TELEGRAM_API_URL from env:', TELEGRAM_API_URL ? 'SET' : 'NOT SET');
    console.log('[telegram/create-session] TELEGRAM_API_URL value:', TELEGRAM_API_URL);
    
    if (!TELEGRAM_API_URL) {
        console.error('[telegram/create-session] ERROR: TELEGRAM_API_URL is not set in environment variables');
            console.error('[telegram/create-session] Environment check:', {
            NODE_ENV: process.env.NODE_ENV,
            RENDER_ENV: process.env.RENDER_ENV,
            availableEnvVars: Object.keys(process.env).filter(k => k.includes('TELEGRAM'))
        });
        return NextResponse.json(
            { 
                error: "Configuration Error: TELEGRAM_API_URL is not set",
                details: "Проверьте переменные окружения на Cloudflare. TELEGRAM_API_URL должен быть установлен.",
                environment: process.env.NODE_ENV || 'unknown'
            },
            { status: 500 }
        );
    }

    try {
        // !!! ИСПРАВЛЕНИЕ 502: Безопасное чтение и пересылка тела запроса !!!
        // 1. Читаем тело как сырой текст, чтобы избежать проблем с request.json()
        const rawBody = await request.text();
        
        console.log('[telegram/create-session] Request body:', rawBody);
        console.log('[telegram/create-session] Request body length:', rawBody.length);

        // 2. Делаем прямой запрос к бэкенду Telegram-бота на Render
        // Используем /api/telegram/create-session (с префиксом /api, так как route зарегистрирован как app.use('/api/telegram', ...))
        const telegramUrl = `${TELEGRAM_API_URL}/api/telegram/create-session`;
        console.log('[telegram/create-session] Full URL to fetch:', telegramUrl);
        console.log('[telegram/create-session] URL components:', {
            base: TELEGRAM_API_URL,
            endpoint: '/api/telegram/create-session',
            full: telegramUrl
        });
        
        console.log('[telegram/create-session] Starting fetch to Render...');
        const fetchStartTime = Date.now();
        
        const resp = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                // НЕ ПЕРЕСЫЛАЕМ 'Origin' и прочее, чтобы избежать CORS на Render
            },
            body: rawBody, // Отправляем сырое тело, как получили
        });

        const fetchDuration = Date.now() - fetchStartTime;
        console.log('[telegram/create-session] Fetch completed in', fetchDuration, 'ms');
        console.log('[telegram/create-session] Render response status:', resp.status);
        console.log('[telegram/create-session] Render response statusText:', resp.statusText);
        console.log('[telegram/create-session] Render response headers:', Object.fromEntries(resp.headers.entries()));
        console.log('[telegram/create-session] Response URL:', resp.url);
        console.log('[telegram/create-session] Response redirected:', resp.redirected);
        console.log('[telegram/create-session] Response ok:', resp.ok);

        // Получаем ответ от Render
        // При ошибке 502/500 тело может быть невалидным JSON, поэтому используем try/catch
        let json;
        let responseText: string = '';
        try {
            responseText = await resp.text();
            console.log('[telegram/create-session] Render response body:', responseText);
            json = JSON.parse(responseText);
        } catch (e) {
            // Если Render вернул не-JSON (например, HTML-страницу ошибки 502)
            console.error('[telegram/create-session] Render responded with non-JSON body:', responseText || 'No response text');
            console.error('[telegram/create-session] Parse error:', e);
            
            // Если код 502, выбрасываем ошибку с нашим текстом, но сохраняем код
            if (resp.status === 502) {
                return NextResponse.json(
                    { error: `Сервис Telegram бота недоступен (502). Проверьте статус сервиса на Render.` },
                    { status: 502 }
                );
            }
            
            if (resp.status === 500) {
                return NextResponse.json(
                    { error: `Ошибка на сервере Telegram бота (500). Проверьте логи Render сервиса.` },
                    { status: 500 }
                );
            }
            
            if (resp.status === 404) {
                console.error('[telegram/create-session] 404 Error Details:', {
                    requestedUrl: telegramUrl,
                    responseUrl: resp.url,
                    statusText: resp.statusText
                });
                return NextResponse.json(
                    { 
                        error: `Эндпоинт Telegram бота не найден (404).`,
                        details: `Запрошенный URL: ${telegramUrl}. Проверьте, что URL Render сервиса правильный и эндпоинт /telegram/create-session существует.`,
                        requestedUrl: telegramUrl
                    },
                    { status: 404 }
                );
            }
            
            // Для всех остальных ошибок
            console.error('[telegram/create-session] Non-JSON error response:', {
                status: resp.status,
                statusText: resp.statusText,
                responseText: responseText.substring(0, 500)
            });
            return NextResponse.json(
                { 
                    error: `Ошибка при подключении к Telegram боту. Код: ${resp.status}`,
                    details: responseText || resp.statusText,
                    requestedUrl: telegramUrl
                },
                { status: resp.status }
            );
        }
        
        // Если Render вернул ошибку в JSON
        if (!resp.ok) {
            console.error('[telegram/create-session] Render error response:', json);
            console.error('[telegram/create-session] Error details:', {
                status: resp.status,
                statusText: resp.statusText,
                error: json?.error,
                fullResponse: json
            });
            
            if (resp.status === 404) {
                return NextResponse.json(
                    { 
                        error: `Эндпоинт Telegram бота не найден (404).`,
                        details: json?.error || `Проверьте, что URL Render сервиса правильный и эндпоинт /telegram/create-session существует.`,
                        requestedUrl: telegramUrl
                    },
                    { status: 404 }
                );
            }
            
            return NextResponse.json(
                { 
                    error: json?.error || `Ошибка Telegram бота: ${resp.status}`,
                    details: json?.details || json?.message,
                    requestedUrl: telegramUrl
                },
                { status: resp.status }
            );
        }
        
        // Логируем успешный ответ для отладки
        console.log('[telegram/create-session] ✅ Success response from Render:', {
            hasSessionToken: !!json.sessionToken,
            hasTelegramLink: !!json.telegramLink,
            sessionTokenPreview: json.sessionToken ? json.sessionToken.substring(0, 20) + '...' : 'missing',
            telegramLinkPreview: json.telegramLink ? json.telegramLink.substring(0, 50) + '...' : 'missing'
        });
        
        // Передаем ответ обратно на фронт
        return NextResponse.json(json, { status: resp.status });

    } catch (e: any) {
        console.error('[telegram/create-session] ========== EXCEPTION ==========');
        console.error('[telegram/create-session] API Proxy Error:', e);
        console.error('[telegram/create-session] Error name:', e?.name);
        console.error('[telegram/create-session] Error message:', e?.message);
        console.error('[telegram/create-session] Error stack:', e?.stack);
        console.error('[telegram/create-session] Error cause:', e?.cause);
        console.error('[telegram/create-session] TELEGRAM_API_URL was:', TELEGRAM_API_URL);
        console.error('[telegram/create-session] ===============================');
        
        // Эта ошибка возникает, если Next.js не смог достучаться до Render
        return NextResponse.json(
            { 
                error: "Не удалось подключиться к сервису Telegram бота.",
                details: e?.message || 'Unknown error',
                troubleshooting: "Проверьте: 1) Сервис запущен на Render, 2) Переменная TELEGRAM_API_URL настроена правильно, 3) URL доступен из интернета",
                telegramApiUrl: TELEGRAM_API_URL ? 'SET' : 'NOT SET'
            },
            { status: 500 }
        );
    }
}


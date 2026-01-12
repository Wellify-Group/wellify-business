// app/api/telegram/create-session/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Используем основной бэкенд URL, так как Telegram бот теперь интегрирован в основной бэкенд
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export async function POST(request: NextRequest) {
    console.log('[telegram/create-session] ========== START REQUEST ==========');
    console.log('[telegram/create-session] NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('[telegram/create-session] BACKEND_API_URL from env:', BACKEND_API_URL ? 'SET' : 'NOT SET');
    console.log('[telegram/create-session] BACKEND_API_URL value:', BACKEND_API_URL);
    
    if (!BACKEND_API_URL) {
        console.error('[telegram/create-session] ERROR: NEXT_PUBLIC_API_URL or RENDER_API_URL is not set in environment variables');
            console.error('[telegram/create-session] Environment check:', {
            NODE_ENV: process.env.NODE_ENV,
            availableEnvVars: Object.keys(process.env).filter(k => k.includes('API_URL'))
        });
        return NextResponse.json(
            { 
                error: "Configuration Error: NEXT_PUBLIC_API_URL is not set",
                details: "Проверьте переменные окружения на Vercel/Cloudflare. NEXT_PUBLIC_API_URL должен быть установлен.",
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

        // 2. Делаем запрос к основному бэкенду (Telegram бот теперь интегрирован в основной бэкенд)
        const telegramUrl = `${BACKEND_API_URL}/api/telegram/create-session`;
        console.log('[telegram/create-session] Full URL to fetch:', telegramUrl);
        console.log('[telegram/create-session] URL components:', {
            base: BACKEND_API_URL,
            endpoint: '/api/telegram/create-session',
            full: telegramUrl
        });
        
        console.log('[telegram/create-session] Starting fetch to backend...');
        const fetchStartTime = Date.now();
        
        const resp = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: rawBody, // Отправляем сырое тело, как получили
        });

        const fetchDuration = Date.now() - fetchStartTime;
        console.log('[telegram/create-session] Fetch completed in', fetchDuration, 'ms');
        console.log('[telegram/create-session] Backend response status:', resp.status);
        console.log('[telegram/create-session] Backend response statusText:', resp.statusText);
        console.log('[telegram/create-session] Backend response headers:', Object.fromEntries(resp.headers.entries()));
        console.log('[telegram/create-session] Response URL:', resp.url);
        console.log('[telegram/create-session] Response redirected:', resp.redirected);
        console.log('[telegram/create-session] Response ok:', resp.ok);

        // Получаем ответ от бэкенда
        // При ошибке 502/500 тело может быть невалидным JSON, поэтому используем try/catch
        let json;
        let responseText: string = '';
        try {
            responseText = await resp.text();
            console.log('[telegram/create-session] Backend response body:', responseText);
            json = JSON.parse(responseText);
        } catch (e) {
            // Если бэкенд вернул не-JSON (например, HTML-страницу ошибки 502)
            console.error('[telegram/create-session] Backend responded with non-JSON body:', responseText || 'No response text');
            console.error('[telegram/create-session] Parse error:', e);
            
            // Если код 502, выбрасываем ошибку с нашим текстом, но сохраняем код
            if (resp.status === 502) {
                return NextResponse.json(
                    { error: `Бэкенд недоступен (502). Проверьте статус сервиса на Render.` },
                    { status: 502 }
                );
            }
            
            if (resp.status === 500) {
                return NextResponse.json(
                    { error: `Ошибка на сервере бэкенда (500). Проверьте логи Render сервиса.` },
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
                        error: `Эндпоинт не найден (404).`,
                        details: `Запрошенный URL: ${telegramUrl}. Проверьте, что URL бэкенда правильный и эндпоинт /api/telegram/create-session существует.`,
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
                    error: `Ошибка при подключении к бэкенду. Код: ${resp.status}`,
                    details: responseText || resp.statusText,
                    requestedUrl: telegramUrl
                },
                { status: resp.status }
            );
        }
        
        // Если бэкенд вернул ошибку в JSON
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
        console.error('[telegram/create-session] BACKEND_API_URL was:', BACKEND_API_URL);
        console.error('[telegram/create-session] ===============================');
        
        // Эта ошибка возникает, если Next.js не смог достучаться до бэкенда
        return NextResponse.json(
            { 
                error: "Не удалось подключиться к бэкенду.",
                details: e?.message || 'Unknown error',
                troubleshooting: "Проверьте: 1) Сервис запущен на Render, 2) Переменная NEXT_PUBLIC_API_URL настроена правильно, 3) URL доступен из интернета",
                backendApiUrl: BACKEND_API_URL ? 'SET' : 'NOT SET'
            },
            { status: 500 }
        );
    }
}


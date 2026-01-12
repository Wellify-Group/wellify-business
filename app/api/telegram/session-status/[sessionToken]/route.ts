// app/api/telegram/session-status/[sessionToken]/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic"; 
export const runtime = "nodejs";

// Используем основной бэкенд URL, так как Telegram бот теперь интегрирован в основной бэкенд
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export async function GET(
    request: NextRequest,
    { params }: { params: { sessionToken: string } }
) {
    console.log('[telegram/session-status] ========== START REQUEST ==========');
    console.log('[telegram/session-status] BACKEND_API_URL:', BACKEND_API_URL ? 'SET' : 'NOT SET');
    
    if (!BACKEND_API_URL) {
        console.error('[telegram/session-status] ERROR: NEXT_PUBLIC_API_URL or RENDER_API_URL is not set');
        return NextResponse.json(
            { error: "Configuration Error: NEXT_PUBLIC_API_URL is not set" },
            { status: 500 }
        );
    }

    const { sessionToken } = params;
    console.log('[telegram/session-status] Session token:', sessionToken?.substring(0, 20) + '...');

    try {
        // Делаем запрос к основному бэкенду (Telegram бот интегрирован в основной бэкенд)
        const backendUrl = `${BACKEND_API_URL}/api/telegram/session-status/${sessionToken}`;
        console.log('[telegram/session-status] Fetching from:', backendUrl);
        
        const resp = await fetch(backendUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
        });

        console.log('[telegram/session-status] Backend response status:', resp.status);
        console.log('[telegram/session-status] Backend response ok:', resp.ok);

        // Безопасно парсим ответ
        let json;
        try {
            const responseText = await resp.text();
            console.log('[telegram/session-status] Backend response text length:', responseText.length);
            
            if (!responseText) {
                console.error('[telegram/session-status] Backend returned empty response');
                return NextResponse.json(
                    { error: 'Backend returned empty response', status: 'error' },
                    { status: 500 }
                );
            }
            
            json = JSON.parse(responseText);
            console.log('[telegram/session-status] Parsed backend data:', json);
        } catch (parseError: any) {
            console.error('[telegram/session-status] Failed to parse backend JSON response:', parseError);
            return NextResponse.json(
                { 
                    error: 'Invalid response from backend', 
                    status: 'error',
                    details: parseError.message
                },
                { status: 500 }
            );
        }

        // Передаем ответ обратно на фронт
        return NextResponse.json(json, { status: resp.status });

    } catch (e: any) {
        console.error('[telegram/session-status] ========== EXCEPTION ==========');
        console.error('[telegram/session-status] API Proxy Error:', e);
        console.error('[telegram/session-status] Error details:', {
            message: e?.message,
            stack: e?.stack,
            cause: e?.cause
        });
        console.error('[telegram/session-status] BACKEND_API_URL was:', BACKEND_API_URL);
        
        return NextResponse.json(
            { 
                error: "Не удалось подключиться к сервису бэкенда.",
                status: 'error',
                details: e?.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
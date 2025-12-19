import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json({
    // Публичные переменные (должны быть доступны и на сервере, и в браузере)
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    
    // Значения (маскированные)
    NEXT_PUBLIC_APP_URL_VALUE: process.env.NEXT_PUBLIC_APP_URL || null,
    NEXT_PUBLIC_SUPABASE_URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` 
      : null,
    
    // Серверные переменные
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    
    // Vercel окружение
    VERCEL_ENV: process.env.VERCEL_ENV || 'local',
    VERCEL_URL: process.env.VERCEL_URL || null,
    
    // Важно: если переменные есть здесь (на сервере), но отсутствуют в браузере,
    // значит deployment был собран ДО добавления переменных в Vercel
    message: 'Если переменные SET здесь, но MISSING в браузере - пересоберите deployment в Vercel',
  });
}

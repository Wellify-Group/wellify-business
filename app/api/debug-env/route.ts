// app/api/debug-env/route.ts
// Диагностический endpoint для проверки env переменных

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const envVars = {
    // Публичные переменные (должны быть доступны в браузере)
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    
    // Значения (маскированные для безопасности)
    NEXT_PUBLIC_APP_URL_VALUE: process.env.NEXT_PUBLIC_APP_URL || null,
    NEXT_PUBLIC_SUPABASE_URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` 
      : null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_VALUE: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
      : null,
    
    // Серверные переменные (не должны быть в браузере)
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    
    // Vercel окружение
    VERCEL_ENV: process.env.VERCEL_ENV || 'local',
    VERCEL_URL: process.env.VERCEL_URL || null,
    
    // Все NEXT_PUBLIC_* переменные
    allNextPublicVars: Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .reduce((acc, key) => {
        acc[key] = process.env[key] ? 'SET' : 'MISSING';
        return acc;
      }, {} as Record<string, string>),
  };

  return NextResponse.json(envVars, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}


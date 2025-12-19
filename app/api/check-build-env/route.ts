// app/api/check-build-env/route.ts
// Проверка переменных во время сборки (для диагностики)

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Проверяем, какие переменные были доступны во время сборки
  // Это поможет понять, были ли переменные доступны в момент сборки
  
  const buildTimeCheck = {
    message: 'Этот endpoint показывает переменные, доступные на сервере во время runtime',
    note: 'Для проверки переменных во время сборки нужно смотреть логи сборки в Vercel',
    serverRuntime: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    },
    instructions: [
      '1. Vercel → Deployments → выберите последний deployment',
      '2. Откройте "Build Logs"',
      '3. Найдите строки с "NEXT_PUBLIC_" - они должны быть видны во время сборки',
      '4. Если переменных нет в логах - они не были доступны во время сборки',
      '5. Проверьте scope переменных в Vercel Settings → Environment Variables',
    ],
  };

  return NextResponse.json(buildTimeCheck, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}


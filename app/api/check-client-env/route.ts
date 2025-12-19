// app/api/check-client-env/route.ts
// Проверка, какие переменные доступны в клиентском bundle

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Этот endpoint возвращает HTML страницу с JavaScript,
  // который проверяет переменные в браузере
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Client Environment Variables Check</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
    .success { color: #4ade80; }
    .error { color: #f87171; }
    .warning { color: #fbbf24; }
    pre { background: #2a2a2a; padding: 15px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Client Environment Variables Check</h1>
  <div id="results"></div>
  <script>
    const results = document.getElementById('results');
    
    // Проверяем переменные в браузере
    const requiredVars = [
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];
    
    const allEnvKeys = typeof process !== 'undefined' && process.env 
      ? Object.keys(process.env) 
      : [];
    const nextPublicKeys = allEnvKeys.filter(key => key.startsWith('NEXT_PUBLIC_'));
    
    let html = '<h2>Статистика:</h2>';
    html += '<pre>';
    html += 'Всего ключей в process.env: ' + allEnvKeys.length + '\\n';
    html += 'NEXT_PUBLIC_* ключей: ' + nextPublicKeys.length + '\\n';
    html += '</pre>';
    
    if (nextPublicKeys.length === 0) {
      html += '<p class="error">❌ КРИТИЧНО: В браузере нет НИ ОДНОЙ NEXT_PUBLIC_* переменной!</p>';
      html += '<p class="warning">Это означает, что переменные не были встроены в bundle во время сборки.</p>';
      html += '<p>Решение: пересоберите deployment в Vercel.</p>';
    } else {
      html += '<h2>Найденные NEXT_PUBLIC_* переменные:</h2>';
      html += '<pre>';
      nextPublicKeys.forEach(key => {
        const value = process.env[key];
        html += key + ': ' + (value ? 'SET (' + value.substring(0, 30) + '...)' : 'MISSING') + '\\n';
      });
      html += '</pre>';
    }
    
    html += '<h2>Проверка обязательных переменных:</h2>';
    html += '<pre>';
    const missing = [];
    requiredVars.forEach(key => {
      const exists = !!process.env[key];
      if (exists) {
        html += '<span class="success">✅ ' + key + ': SET</span>\\n';
      } else {
        html += '<span class="error">❌ ' + key + ': MISSING</span>\\n';
        missing.push(key);
      }
    });
    html += '</pre>';
    
    if (missing.length === 0) {
      html += '<p class="success">✅ Все переменные на месте! Проблема решена.</p>';
    } else {
      html += '<p class="error">❌ Отсутствуют: ' + missing.join(', ') + '</p>';
    }
    
    results.innerHTML = html;
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}


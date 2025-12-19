// lib/config/appConfig.client.ts
// Клиентский конфиг - только NEXT_PUBLIC_* переменные
// Безопасно для использования в браузере

// Валидация клиентских переменных (только в браузере, не на сервере)
if (typeof window !== 'undefined') {
  const requiredVars = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = requiredVars.filter((v) => !process.env[v]);
  
  // Детальная диагностика
  if (missing.length > 0) {
    console.group('🔍 Диагностика Environment Variables');
    console.log('Отсутствующие переменные:', missing);
    console.log('Доступные NEXT_PUBLIC_* переменные:', 
      Object.keys(process.env)
        .filter(key => key.startsWith('NEXT_PUBLIC_'))
        .reduce((acc, key) => {
          acc[key] = process.env[key] ? `${process.env[key]?.substring(0, 20)}...` : 'undefined';
          return acc;
        }, {} as Record<string, string>)
    );
    console.log('Все process.env ключи (первые 20):', Object.keys(process.env).slice(0, 20));
    console.log('⚠️ Проблема: переменные NEXT_PUBLIC_* должны быть встроены в bundle во время сборки Next.js');
    console.log('📋 Решение:');
    console.log('1. Vercel → Settings → Environment Variables → проверьте, что переменные установлены для нужного scope');
    console.log('2. Vercel → Deployments → найдите последний Preview deployment → Redeploy');
    console.log('3. Убедитесь, что переменные добавлены ДО сборки (не после)');
    console.log('4. Проверьте, что scope правильный: "Preview" или "All Pre-Production Environments"');
    console.groupEnd();
  }
}

export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL!,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  telegramBotUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME!,
  // Optional: can be separated by environment in Vercel via *_MAIN / *_DEV
  telegramApiUrl:
    process.env.NEXT_PUBLIC_TELEGRAM_API_URL_MAIN ||
    process.env.NEXT_PUBLIC_TELEGRAM_API_URL_DEV ||
    process.env.NEXT_PUBLIC_TELEGRAM_API_URL,
};



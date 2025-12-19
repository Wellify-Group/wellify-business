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
  if (missing.length > 0) {
    console.error(
      'Missing required client environment variables:',
      missing,
      '\n',
      '⚠️ Причина: переменные NEXT_PUBLIC_* встраиваются в bundle во время сборки.',
      '\n',
      'Решение:',
      '\n',
      '1. Проверьте Vercel → Settings → Environment Variables',
      '\n',
      '2. Убедитесь, что переменные установлены для Preview scope',
      '\n',
      '3. Пересоберите Preview deployment после добавления переменных',
      '\n',
      '4. Для локальной разработки добавьте переменные в .env.local'
    );
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



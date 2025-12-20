// lib/config/appConfig.client.ts
// Клиентский конфиг - только NEXT_PUBLIC_* переменные
// Безопасно для использования в браузере


// Используем функцию вместо константы, чтобы переменные читались во время выполнения
// Это гарантирует, что Next.js встроит их значения в bundle
export function getAppConfig() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    telegramBotUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '',
    // Optional: can be separated by environment in Vercel via *_MAIN / *_DEV
    telegramApiUrl:
      process.env.NEXT_PUBLIC_TELEGRAM_API_URL_MAIN ||
      process.env.NEXT_PUBLIC_TELEGRAM_API_URL_DEV ||
      process.env.NEXT_PUBLIC_TELEGRAM_API_URL ||
      '',
  };
}

// Экспортируем также как константу для обратной совместимости
// Но используем функцию внутри, чтобы гарантировать чтение переменных
export const appConfig = getAppConfig();


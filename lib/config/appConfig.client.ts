// lib/config/appConfig.client.ts
// Клиентский конфиг - только NEXT_PUBLIC_* переменные
// Безопасно для использования в браузере
// ВАЖНО: Используем только прямое статическое обращение к process.env.NEXT_PUBLIC_*
// для того, чтобы Next.js мог статически вшить значения в клиентский бандл

// Валидация обязательных переменных окружения (только в браузере, не во время сборки)
if (typeof window !== 'undefined') {
  // ВАЖНО: Используем прямое статическое обращение к каждой переменной,
  // а не динамический доступ через process.env[v], чтобы Next.js мог их статически определить
  const missing: string[] = [];
  
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    missing.push('NEXT_PUBLIC_APP_URL');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  if (missing.length > 0) {
    console.error('❌ Отсутствуют обязательные переменные окружения:', missing.join(', '));
    console.error('Убедитесь, что переменные установлены в Cloudflare и deployment пересобран.');
  }
}

// Используем функцию вместо константы, чтобы переменные читались во время выполнения
// ВАЖНО: Все обращения к process.env должны быть прямыми и статическими
// (не через индексацию или циклы), чтобы Next.js мог вшить значения в bundle
export function getAppConfig() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    telegramBotUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '',
    // Optional: can be separated by environment in Cloudflare via *_MAIN / *_DEV
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


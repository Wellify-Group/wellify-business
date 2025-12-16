// lib/config/appConfig.client.ts
// Клиентский конфиг - только NEXT_PUBLIC_* переменные
// Безопасно для использования в браузере

export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL!,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  telegramBotUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME!,
};



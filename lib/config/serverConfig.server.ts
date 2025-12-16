// lib/config/serverConfig.server.ts
// Серверный конфиг - содержит секреты
// Импорт 'server-only' гарантирует, что этот файл не попадёт в client bundle

import 'server-only';

export const serverConfig = {
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  appBaseUrl: process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL!,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
  telegramBotUsername:
    process.env.TELEGRAM_BOT_USERNAME ?? process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME!,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  telegramApiUrl: process.env.TELEGRAM_API_URL,
  supportManagersChatId: process.env.SUPPORT_MANAGERS_CHAT_ID,
};



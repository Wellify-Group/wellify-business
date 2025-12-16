// lib/config/appConfig.ts
// ⚠️ DEPRECATED: Этот файл устарел и не должен использоваться
// Используйте вместо него:
// - Для клиента: import { appConfig } from '@/lib/config/appConfig.client'
// - Для сервера: import { serverConfig } from '@/lib/config/serverConfig.server'

/**
 * @deprecated Используйте appConfig.client.ts для клиентских компонентов
 */
export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL!,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  telegramBotUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME!,
};

/**
 * @deprecated Используйте serverConfig.server.ts для серверных файлов
 */
export const serverConfig = {
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  appBaseUrl: process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL!,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME ?? process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME!,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  telegramApiUrl: process.env.NEXT_PUBLIC_TELEGRAM_API_URL,
  supportManagersChatId: process.env.SUPPORT_MANAGERS_CHAT_ID,
};


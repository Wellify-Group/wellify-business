// lib/config/serverConfig.server.ts
// Серверный конфиг - содержит секреты
// Импорт 'server-only' гарантирует, что этот файл не попадёт в client bundle

import 'server-only';
import { validateServerEnv, assertEnvValid } from './envValidation';
import { getSupabaseAdminEnv } from '@/lib/supabase/env';

// Валидация при импорте (только в runtime; НЕ во время next build на Vercel).
// Next выставляет NEXT_PHASE=phase-production-build во время сборки.
const isNextBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-production-export';

if (!isNextBuildPhase && (process.env.NODE_ENV === 'production' || process.env.VALIDATE_ENV === 'true')) {
  const validationResult = validateServerEnv();
  assertEnvValid(validationResult, 'Server environment validation');
}

// Используем единый env модуль для Supabase переменных
const { url: supabaseUrl, serviceRoleKey: supabaseServiceRoleKey } = getSupabaseAdminEnv();

export const serverConfig = {
  supabaseUrl,
  supabaseServiceRoleKey,
  appBaseUrl: process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL!,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
  telegramBotUsername:
    process.env.TELEGRAM_BOT_USERNAME ?? process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME!,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  // TELEGRAM_API_URL - server-only variable, no NEXT_PUBLIC fallback
  telegramApiUrl: process.env.TELEGRAM_API_URL,
  supportManagersChatId: process.env.SUPPORT_MANAGERS_CHAT_ID,
  webhookUrl: process.env.WEBHOOK_URL,
};



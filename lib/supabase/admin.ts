// lib/supabase/admin.ts (КОРРЕКТНАЯ ИНИЦИАЛИЗАЦИЯ ДЛЯ VERCEL/NEXT.JS)

import { createClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client with service role key
 * Use this for admin operations that bypass RLS
 * 
 * This client has full access to all tables and bypasses Row Level Security (RLS)
 * ⚠️ NEVER expose this client to the browser or use it in client components
 */
export function createAdminSupabaseClient() {
  // !!! КРИТИЧНО: Используем VERCEL_ENV для выбора ключа !!!
  // VERCEL_ENV = 'production' для main ветки, 'preview' для dev-веток, 'development' для локального запуска.
  const isProduction = process.env.VERCEL_ENV === 'production';
  const isLocal = process.env.VERCEL_ENV === 'development';

  // Предполагаем MAIN для prod (если задано), иначе fallback на обычные локальные переменные.
  const SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL_MAIN || process.env.NEXT_PUBLIC_SUPABASE_URL;

  const SERVICE_ROLE_KEY = isProduction
    ? process.env.SUPABASE_SERVICE_ROLE_KEY_MAIN
    : process.env.SUPABASE_SERVICE_ROLE_KEY_DEV || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      `[Admin Client] Supabase URL or Service Role Key is missing.\n` +
        `VERCEL_ENV=${process.env.VERCEL_ENV ?? 'undefined'} (isProduction=${isProduction}, isLocal=${isLocal}).\n` +
        `Is VERCEL_ENV set correctly? Is SUPABASE_SERVICE_ROLE_KEY_MAIN/DEV set?`
    );
  }

  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}


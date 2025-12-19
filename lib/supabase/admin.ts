// lib/supabase/admin.ts
// Admin Supabase client with service role key
// Uses unified env module - NO HARDCODED KEYS

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminEnv, logSupabaseEnv } from './env';

/**
 * Admin Supabase client with service role key
 * Use this for admin operations that bypass RLS
 *
 * This client has full access to all tables and bypasses Row Level Security (RLS)
 * ⚠️ NEVER expose this client to the browser or use it in client components
 */
export function createAdminSupabaseClient() {
  // Защита от использования в браузере
  if (typeof window !== 'undefined') {
    throw new Error(
      'Admin client must not run in browser. Use createBrowserSupabaseClient() instead.'
    );
  }

  // Используем единый env модуль (БЕЗ хардкодов)
  const { url: supabaseUrl, serviceRoleKey: supabaseServiceRoleKey } =
    getSupabaseAdminEnv();

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      `[Admin Client] Supabase URL or Service Role Key is missing.\n` +
        `VERCEL_ENV=${process.env.VERCEL_ENV ?? 'undefined'}.\n` +
        `Expected: SUPABASE_SERVICE_ROLE_KEY_MAIN/DEV or SUPABASE_SERVICE_ROLE_KEY`
    );
  }

  // Безопасное логирование (без ключей)
  logSupabaseEnv('AdminClient');

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

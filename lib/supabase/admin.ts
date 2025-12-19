// lib/supabase/admin.ts
// Admin Supabase client with service role key
// NO HARDCODED KEYS - uses environment variables only

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminEnv, logSupabaseEnv } from './env';

/**
 * Admin Supabase client with service role key
 * Use this for admin operations that bypass RLS
 *
 * This client has full access to all tables and bypasses Row Level Security (RLS)
 * ⚠️ NEVER expose this client to the browser or use it in client components
 * ⚠️ CRITICAL: If service role keys were exposed in repository, rotate them immediately in Supabase Dashboard
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

  if (!supabaseUrl) {
    throw new Error(
      `[Admin Client] Missing NEXT_PUBLIC_SUPABASE_URL. ` +
        `Set it in Vercel Environment Variables (Production/Preview/Development scope).`
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      `[Admin Client] Missing SUPABASE_SERVICE_ROLE_KEY. ` +
        `Set it in Vercel Environment Variables (Production/Preview/Development scope). ` +
        `⚠️ CRITICAL: If service role keys were exposed in repository, rotate them immediately in Supabase Dashboard.`
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

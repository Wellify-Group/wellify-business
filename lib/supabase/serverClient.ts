import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from './env';

/**
 * @deprecated Используйте createServerSupabaseClient из '@/lib/supabase/server' для правильной работы с cookies
 * Этот файл оставлен для обратной совместимости
 */
export function createServerSupabaseClient() {
  // Используем единый env модуль вместо прямого чтения process.env
  const { url, anonKey } = getSupabasePublicEnv();

  if (!url || !anonKey) {
    throw new Error('Supabase env vars are missing');
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}



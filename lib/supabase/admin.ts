import { createClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client with service role key
 * Use this for admin operations that bypass RLS
 * 
 * This client has full access to all tables and bypasses Row Level Security (RLS)
 * ⚠️ NEVER expose this client to the browser or use it in client components
 */
export function createAdminSupabaseClient() {
  const isVercelProduction = process.env.VERCEL_ENV === 'production';

  // In Vercel Production ("main"), use dedicated _MAIN env vars to avoid conflicts with local/dev keys.
  // Otherwise (local dev / preview), use the default env vars.
  const supabaseUrl = isVercelProduction
    ? process.env.SUPABASE_URL_MAIN
    : process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseServiceRoleKey = isVercelProduction
    ? process.env.SUPABASE_SERVICE_ROLE_KEY_MAIN
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      isVercelProduction
        ? 'Missing SUPABASE_URL_MAIN environment variable (Vercel Production)'
        : 'Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      isVercelProduction
        ? 'Missing SUPABASE_SERVICE_ROLE_KEY_MAIN environment variable (Vercel Production)'
        : 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}


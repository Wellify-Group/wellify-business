import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

function isNextBuildPhase() {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-production-export'
  );
}

function getPublicSupabaseEnv() {
  // На Vercel удобно держать раздельные MAIN/DEV переменные
  const isProduction = process.env.VERCEL_ENV === 'production';

  const url =
    (isProduction ? process.env.NEXT_PUBLIC_SUPABASE_URL_MAIN : process.env.NEXT_PUBLIC_SUPABASE_URL_DEV) ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const anonKey =
    (isProduction ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_MAIN : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV) ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, anonKey, isProduction };
}

function createMissingEnvProxy() {
  const msg =
    'Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
    '(or NEXT_PUBLIC_SUPABASE_URL_MAIN/DEV + NEXT_PUBLIC_SUPABASE_ANON_KEY_MAIN/DEV on Vercel).';

  return new Proxy(
    {} as any,
    {
      get(_target, prop) {
        // чтобы не ломать harmless-проверки типа `if (supabase)`
        if (prop === Symbol.toStringTag) return 'SupabaseClient';
        throw new Error(msg);
      },
    }
  );
}

/**
 * Browser client for Supabase (with SSR support)
 * Use this in client components and browser-side code
 */
export function createBrowserSupabaseClient() {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getPublicSupabaseEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')

    // Важно: Next может пререндерить client-страницы на сервере в build phase.
    // Не роняем сборку — ошибка проявится при первом реальном использовании в браузере.
    if (typeof window === 'undefined' || isNextBuildPhase()) {
      return createMissingEnvProxy();
    }

    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}

/**
 * Simple browser client (fallback, without SSR)
 * Use this if you need a simple client without cookie handling
 */
export function getSupabaseClient() {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getPublicSupabaseEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')

    if (typeof window === 'undefined' || isNextBuildPhase()) {
      return createMissingEnvProxy();
    }

    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

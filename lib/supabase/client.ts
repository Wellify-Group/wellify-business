// lib/supabase/client.ts
// Browser client for Supabase (with SSR support)
// Uses unified env module

import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from './env';

function isNextBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-production-export'
  );
}

function createMissingEnvProxy() {
  const msg =
    'Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
    'in Vercel Environment Variables (Production/Preview/Development scope).';

  return new Proxy({} as any, {
    get(_target, prop) {
      // чтобы не ломать harmless-проверки типа `if (supabase)`
      if (prop === Symbol.toStringTag) return 'SupabaseClient';
      throw new Error(msg);
    },
  });
}

/**
 * Browser client for Supabase (with SSR support)
 * Use this in client components and browser-side code
 */
export function createBrowserSupabaseClient() {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabasePublicEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set'
    );

    // Важно: Next может пререндерить client-страницы на сервере в build phase.
    // Не роняем сборку — ошибка проявится при первом реальном использовании в браузере.
    if (typeof window === 'undefined' || isNextBuildPhase()) {
      return createMissingEnvProxy();
    }

    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Simple browser client (fallback, without SSR)
 * Use this if you need a simple client without cookie handling
 */
export function getSupabaseClient() {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabasePublicEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set'
    );

    if (typeof window === 'undefined' || isNextBuildPhase()) {
      return createMissingEnvProxy();
    }

    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

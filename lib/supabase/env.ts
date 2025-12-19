// lib/supabase/env.ts
// Единый источник истины для Supabase environment variables
// Поддерживает Vercel Production (MAIN) и Preview/Development (DEV)
// 
// ВАЖНО: getSupabasePublicEnv может использоваться на клиенте и сервере
// getSupabaseAdminEnv используется только на сервере (контролируется в admin.ts)

/**
 * Определяет, является ли текущее окружение Vercel Production
 */
export function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

/**
 * Получает публичные переменные окружения Supabase (URL + Anon Key)
 * Приоритет:
 *   Production: NEXT_PUBLIC_SUPABASE_URL_MAIN -> NEXT_PUBLIC_SUPABASE_URL
 *   Preview/Dev: NEXT_PUBLIC_SUPABASE_URL_DEV -> NEXT_PUBLIC_SUPABASE_URL
 */
export function getSupabasePublicEnv(): {
  url: string;
  anonKey: string;
} {
  const isProd = isVercelProduction();

  // Приоритет 1: Переменные с суффиксом (для Vercel)
  const urlEnv = isProd
    ? process.env.NEXT_PUBLIC_SUPABASE_URL_MAIN
    : process.env.NEXT_PUBLIC_SUPABASE_URL_DEV;

  const anonKeyEnv = isProd
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_MAIN
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV;

  // Приоритет 2: Стандартные переменные (fallback)
  const url = urlEnv || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = anonKeyEnv || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Проверка наличия (только на сервере, не в build phase)
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-production-export';

  if (!isBuildPhase) {
    if (!url) {
      throw new Error(
        `Missing Supabase URL. VERCEL_ENV=${process.env.VERCEL_ENV ?? 'undefined'}. ` +
          `Expected: ${isProd ? 'NEXT_PUBLIC_SUPABASE_URL_MAIN' : 'NEXT_PUBLIC_SUPABASE_URL_DEV'} ` +
          `or NEXT_PUBLIC_SUPABASE_URL`
      );
    }

    if (!anonKey) {
      throw new Error(
        `Missing Supabase Anon Key. VERCEL_ENV=${process.env.VERCEL_ENV ?? 'undefined'}. ` +
          `Expected: ${isProd ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY_MAIN' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV'} ` +
          `or NEXT_PUBLIC_SUPABASE_ANON_KEY`
      );
    }
  }

  return {
    url: url || '', // Fallback для build phase
    anonKey: anonKey || '', // Fallback для build phase
  };
}

/**
 * Получает серверные переменные окружения Supabase (URL + Service Role Key)
 * Приоритет:
 *   Production: SUPABASE_SERVICE_ROLE_KEY_MAIN -> SUPABASE_SERVICE_ROLE_KEY
 *   Preview/Dev: SUPABASE_SERVICE_ROLE_KEY_DEV -> SUPABASE_SERVICE_ROLE_KEY
 */
export function getSupabaseAdminEnv(): {
  url: string;
  serviceRoleKey: string;
} {
  const isProd = isVercelProduction();

  // Приоритет 1: Переменные с суффиксом (для Vercel)
  const urlEnv = isProd
    ? process.env.NEXT_PUBLIC_SUPABASE_URL_MAIN
    : process.env.NEXT_PUBLIC_SUPABASE_URL_DEV;

  const serviceRoleKeyEnv = isProd
    ? process.env.SUPABASE_SERVICE_ROLE_KEY_MAIN
    : process.env.SUPABASE_SERVICE_ROLE_KEY_DEV;

  // Приоритет 2: Стандартные переменные (fallback)
  const url = urlEnv || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    serviceRoleKeyEnv || process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Проверка наличия (только на сервере, не в build phase)
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-production-export';

  if (!isBuildPhase) {
    if (!url) {
      throw new Error(
        `Missing Supabase URL for admin client. VERCEL_ENV=${process.env.VERCEL_ENV ?? 'undefined'}. ` +
          `Expected: ${isProd ? 'NEXT_PUBLIC_SUPABASE_URL_MAIN' : 'NEXT_PUBLIC_SUPABASE_URL_DEV'} ` +
          `or NEXT_PUBLIC_SUPABASE_URL`
      );
    }

    if (!serviceRoleKey) {
      throw new Error(
        `Missing Supabase Service Role Key. VERCEL_ENV=${process.env.VERCEL_ENV ?? 'undefined'}. ` +
          `Expected: ${isProd ? 'SUPABASE_SERVICE_ROLE_KEY_MAIN' : 'SUPABASE_SERVICE_ROLE_KEY_DEV'} ` +
          `or SUPABASE_SERVICE_ROLE_KEY`
      );
    }
  }

  return {
    url: url || '', // Fallback для build phase
    serviceRoleKey: serviceRoleKey || '', // Fallback для build phase
  };
}

/**
 * Безопасное логирование env (без ключей)
 */
export function logSupabaseEnv(context: string): void {
  const isProd = isVercelProduction();
  const publicEnv = getSupabasePublicEnv();

  console.log(`[${context}] Supabase env:`, {
    vercelEnv: process.env.VERCEL_ENV,
    isProduction: isProd,
    supabaseUrl: publicEnv.url ? `${publicEnv.url.substring(0, 30)}...` : 'MISSING',
    hasAnonKey: !!publicEnv.anonKey,
  });
}


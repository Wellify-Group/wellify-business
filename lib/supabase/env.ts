// lib/supabase/env.ts
// Единый источник истины для Supabase environment variables
// Использует одинаковые имена переменных для всех окружений
// Различия PROD vs PREVIEW задаются через Vercel Environment Scopes

/**
 * Получает публичные переменные окружения Supabase (URL + Anon Key)
 * Использует NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY
 * Значения различаются через Vercel Environment Scopes (Production/Preview/Development)
 */
export function getSupabaseEnv(): {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Проверка наличия (только на сервере, не в build phase)
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-production-export';

  if (!isBuildPhase) {
    if (!url) {
      throw new Error(
        `Missing NEXT_PUBLIC_SUPABASE_URL. ` +
          `Set it in Vercel Environment Variables (Production/Preview/Development scope).`
      );
    }

    if (!anonKey) {
      throw new Error(
        `Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. ` +
          `Set it in Vercel Environment Variables (Production/Preview/Development scope).`
      );
    }
  }

  return {
    url: url || '', // Fallback для build phase
    anonKey: anonKey || '', // Fallback для build phase
    serviceRoleKey: serviceRoleKey || '', // Может быть пустым для client-side
  };
}

/**
 * Получает только публичные переменные (для client-side использования)
 */
export function getSupabasePublicEnv(): {
  url: string;
  anonKey: string;
} {
  const { url, anonKey } = getSupabaseEnv();
  return { url, anonKey };
}

/**
 * Получает серверные переменные (URL + Service Role Key)
 * Используется только на сервере (контролируется в admin.ts через 'server-only')
 */
export function getSupabaseAdminEnv(): {
  url: string;
  serviceRoleKey: string;
} {
  const { url, serviceRoleKey } = getSupabaseEnv();

  // Проверка наличия (только на сервере, не в build phase)
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-production-export';

  if (!isBuildPhase) {
    if (!url) {
      throw new Error(
        `Missing NEXT_PUBLIC_SUPABASE_URL for admin client. ` +
          `Set it in Vercel Environment Variables (Production/Preview/Development scope).`
      );
    }

    if (!serviceRoleKey) {
      throw new Error(
        `Missing SUPABASE_SERVICE_ROLE_KEY. ` +
          `Set it in Vercel Environment Variables (Production/Preview/Development scope). ` +
          `⚠️ CRITICAL: If service role keys were exposed in repository, rotate them immediately in Supabase Dashboard.`
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
  const publicEnv = getSupabasePublicEnv();

  console.log(`[${context}] Supabase env:`, {
    vercelEnv: process.env.VERCEL_ENV,
    supabaseUrl: publicEnv.url ? `${publicEnv.url.substring(0, 30)}...` : 'MISSING',
    hasAnonKey: !!publicEnv.anonKey,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

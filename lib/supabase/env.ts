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
 * ВАЖНО: Использует прямое статическое обращение к process.env.NEXT_PUBLIC_*
 * чтобы Next.js мог статически вшить значения в клиентский бандл
 * 
 * НЕ использует промежуточные функции или динамический доступ,
 * так как это мешает Next.js определить, какие переменные нужны клиенту
 */
export function getSupabasePublicEnv(): {
  url: string;
  anonKey: string;
} {
  // ВАЖНО: Прямое статическое обращение к переменным окружения
  // Next.js может статически определить эти обращения и вшить значения в bundle
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
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
 * Безопасное логирование env (без полных ключей)
 * Используется только на сервере
 */
export function logSupabaseEnv(context: string): void {
  // Логирование только на сервере
  if (typeof window !== 'undefined') {
    return;
  }

  const publicEnv = getSupabasePublicEnv();
  const adminEnv = getSupabaseAdminEnv();

  // Извлекаем hostname из URL
  let hostname = 'MISSING';
  if (publicEnv.url) {
    try {
      const url = new URL(publicEnv.url);
      hostname = url.hostname;
    } catch {
      hostname = 'INVALID_URL';
    }
  }

  // Маскируем первые 8 символов service role key
  let serviceRoleKeyMask = 'MISSING';
  if (adminEnv.serviceRoleKey) {
    const key = adminEnv.serviceRoleKey;
    serviceRoleKeyMask = `${key.substring(0, 8)}...${key.length > 16 ? key.substring(key.length - 4) : ''}`;
  }

  console.log(`[${context}] Supabase env (server-only):`, {
    vercelEnv: process.env.VERCEL_ENV || 'local',
    supabaseHostname: hostname,
    hasNextPublicSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasNextPublicSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceRoleKeyMask: serviceRoleKeyMask,
    // Проверка на старые/неправильные переменные
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSbSecret: !!process.env.sb_secret,
    hasSbPublishable: !!process.env.sb_publishable,
    hasSupabaseJwtSecret: !!process.env.SUPABASE_JWT_SECRET,
  });
}

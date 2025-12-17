// lib/supabase/admin.ts (ОКОНЧАТЕЛЬНАЯ АДАПТИВНАЯ ИНИЦИАЛИЗАЦИЯ)

import { createClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client with service role key
 * Use this for admin operations that bypass RLS
 * 
 * This client has full access to all tables and bypasses Row Level Security (RLS)
 * ⚠️ NEVER expose this client to the browser or use it in client components
 */
export function createAdminSupabaseClient() {
  // Определяем среду
  const isProduction = process.env.VERCEL_ENV === 'production';

  // !!! ИСПРАВЛЕНИЕ 1: Логика выбора URL и КЛЮЧЕЙ !!!
  const PROD_URL = 'https://sdkdzphjtrajjmylakma.supabase.co'; // Ваш MAIN URL
  const DEV_URL = 'https://hbqnkgkkbytyahhnaniu.supabase.co'; // Ваш DEV URL

  const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNka2R6cGhqdHJhampteWxha21hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzNDc2OCwiZXhwIjoyMDgwMDEwNzY4fQ.d47340Zu6zvjAgmjarM3b6PtG3ywzH4dIaeipCD-cq4'; // Ваш MAIN Service Key
  const DEV_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhicW5rZ2trYnl0eWFoaG5hbml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzNDYyNSwiZXhwIjoyMDgwMDEwNjI1fQ.2-bl0K59kq2BbHbYYFZkVi_swLNKESW-i2BrP1EUZFU'; // Ваш DEV Service Key
  
  // Приоритет 1: Переменные Vercel с суффиксом (для Vercel Production/Preview)
  const SUPABASE_URL_ENV = isProduction
    ? process.env.NEXT_PUBLIC_SUPABASE_URL_MAIN 
    : process.env.NEXT_PUBLIC_SUPABASE_URL_DEV;

  const SERVICE_ROLE_KEY_ENV = isProduction
    ? process.env.SUPABASE_SERVICE_ROLE_KEY_MAIN
    : process.env.SUPABASE_SERVICE_ROLE_KEY_DEV;

  // Приоритет 2: Локальные хардкодные значения (для локальной разработки)
  const SUPABASE_URL = SUPABASE_URL_ENV || (isProduction ? PROD_URL : DEV_URL);
  const SERVICE_ROLE_KEY = SERVICE_ROLE_KEY_ENV || (isProduction ? PROD_KEY : DEV_KEY);
  // !!! КОНЕЦ ИСПРАВЛЕНИЯ 1 !!!


  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      `[Admin Client] Supabase URL or Service Role Key is missing.\n` +
        `VERCEL_ENV=${process.env.VERCEL_ENV ?? 'undefined'} (isProduction=${isProduction}).\n` +
        `Is VERCEL_ENV set correctly? Is SUPABASE_SERVICE_ROLE_KEY_MAIN/DEV set?`
    );
  }

  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
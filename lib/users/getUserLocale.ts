/**
 * Утилита для получения языка пользователя из базы данных
 * 
 * @param userId - UUID пользователя
 * @returns Язык пользователя: 'ru' | 'uk' | 'en', по умолчанию 'ru'
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type Locale = 'ru' | 'uk' | 'en';

export async function getUserLocale(userId: string): Promise<Locale> {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('locale')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[getUserLocale] Error fetching locale:', error);
      return 'ru'; // Возвращаем значение по умолчанию
    }

    const locale = data?.locale;
    
    // Валидация и нормализация locale
    if (locale === 'uk' || locale === 'en' || locale === 'ru') {
      return locale;
    }

    // Если locale невалиден или отсутствует, возвращаем 'ru'
    return 'ru';
  } catch (error) {
    console.error('[getUserLocale] Exception:', error);
    return 'ru';
  }
}

/**
 * Получение locale из auth.users.user_metadata (fallback)
 * Используется, если profiles.locale ещё не синхронизирован
 * 
 * Примечание: Для доступа к auth.users требуется admin клиент
 * Эта функция должна использоваться только в server-side коде с admin правами
 */
export async function getUserLocaleFromMetadata(userId: string): Promise<Locale> {
  try {
    // Для доступа к auth.users нужен admin клиент
    // В продакшене это должно быть через API route с admin ключом
    const { createAdminSupabaseClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data?.user) {
      console.error('[getUserLocaleFromMetadata] Error:', error);
      return 'ru';
    }

    const locale = data.user.user_metadata?.locale;
    
    // Маппинг 'ua' -> 'uk' для совместимости
    if (locale === 'ua') return 'uk';
    if (locale === 'uk' || locale === 'en' || locale === 'ru') {
      return locale;
    }

    return 'ru';
  } catch (error) {
    console.error('[getUserLocaleFromMetadata] Exception:', error);
    return 'ru';
  }
}


/**
 * Утилита для получения языка пользователя из базы данных
 * TEMP: Simplified for minimal build - will fix after deployment
 * 
 * @param userId - UUID пользователя
 * @returns Язык пользователя: 'ru' | 'uk' | 'en', по умолчанию 'ru'
 */

export type Locale = 'ru' | 'uk' | 'en';

export async function getUserLocale(userId: string): Promise<Locale> {
  // TEMP: Return default for minimal build
  return 'ru';
}

export async function getUserLocaleFromMetadata(userId: string): Promise<Locale> {
  // TEMP: Return default for minimal build
  return 'ru';
}

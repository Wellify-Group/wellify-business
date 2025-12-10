/**
 * Утилиты для работы с шаблонами писем через Resend
 * 
 * Функции для получения template_id в зависимости от типа письма и языка пользователя
 */

import type { Locale } from './getUserLocale';

export type EmailTemplateType = 'welcome' | 'shift-notice';

/**
 * Получение template_id для письма в зависимости от типа и языка
 * 
 * @param type - Тип письма: 'welcome' | 'shift-notice'
 * @param locale - Язык пользователя: 'ru' | 'uk' | 'en'
 * @returns Template ID для Resend
 * 
 * @example
 * const templateId = getTemplateId('welcome', 'ru');
 * // Возвращает: 'welcome-ru-template-id'
 */
export function getTemplateId(type: EmailTemplateType, locale: Locale): string {
  const map = {
    welcome: {
      ru: 'welcome-ru-template-id',
      uk: 'welcome-uk-template-id',
      en: 'welcome-en-template-id',
    },
    'shift-notice': {
      ru: 'shift-ru-template-id',
      uk: 'shift-uk-template-id',
      en: 'shift-en-template-id',
    },
  } as const;

  // Возвращаем template_id для указанного типа и языка
  // Если locale невалиден, используем 'ru' как fallback
  const validLocale: Locale = locale === 'uk' || locale === 'en' ? locale : 'ru';
  
  return map[type][validLocale] ?? map[type].ru;
}

/**
 * Получение всех template_id для указанного типа письма
 * 
 * @param type - Тип письма
 * @returns Объект с template_id для всех языков
 */
export function getTemplateIdsForType(type: EmailTemplateType): Record<Locale, string> {
  return {
    ru: getTemplateId(type, 'ru'),
    uk: getTemplateId(type, 'uk'),
    en: getTemplateId(type, 'en'),
  };
}


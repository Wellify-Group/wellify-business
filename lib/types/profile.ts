/**
 * Типы для профиля пользователя в Supabase
 * Маппинг русских названий полей на английские для типобезопасности
 */

import { z } from 'zod';

/**
 * Схема валидации профиля с русскими названиями полей (как в БД)
 */
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  'ФИО': z.string().nullable().optional(),
  имя: z.string().nullable().optional(),
  роль: z.enum(['директор', 'менеджер', 'сотрудник']).nullable(),
  бизнес_id: z.string().nullable(),
  код_компании: z.string().nullable().optional(),
  должность: z.string().nullable().optional(),
  активен: z.boolean().nullable().optional(),
  аватар_url: z.string().nullable().optional(),
  телефон: z.string().nullable().optional(),
  страна: z.string().nullable().optional(),
  email_verified: z.boolean().nullable().optional(),
  phone_verified: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type ProfileRaw = z.infer<typeof ProfileSchema>;

/**
 * Типизированный интерфейс профиля с английскими названиями полей
 * Используется в коде для типобезопасности
 */
export interface Profile {
  id: string;
  email: string | null;
  fullName: string | null; // Маппинг 'ФИО'
  shortName: string | null; // Маппинг 'имя'
  role: 'директор' | 'менеджер' | 'сотрудник' | null; // Маппинг 'роль'
  businessId: string | null; // Маппинг 'бизнес_id'
  companyCode: string | null; // Маппинг 'код_компании'
  jobTitle: string | null; // Маппинг 'должность'
  active: boolean | null; // Маппинг 'активен'
  avatarUrl: string | null; // Маппинг 'аватар_url'
  phone: string | null; // Маппинг 'телефон'
  country: string | null; // Маппинг 'страна'
  emailVerified: boolean | null; // Маппинг 'email_verified'
  phoneVerified: boolean | null; // Маппинг 'phone_verified'
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Преобразует сырой профиль из БД (с русскими ключами) в типизированный Profile
 */
export function mapProfileFromDb(raw: ProfileRaw | Record<string, any>): Profile {
  const rawRecord = raw as Record<string, any>;
  return {
    id: rawRecord.id,
    email: rawRecord.email ?? null,
    fullName: rawRecord['ФИО'] ?? rawRecord.фио ?? null,
    shortName: rawRecord.имя ?? null,
    role: rawRecord.роль ?? null,
    businessId: rawRecord.бизнес_id ?? rawRecord.business_id ?? null,
    companyCode: rawRecord.код_компании ?? null,
    jobTitle: rawRecord.должность ?? null,
    active: rawRecord.активен ?? null,
    avatarUrl: rawRecord.аватар_url ?? rawRecord.avatar_url ?? null,
    phone: rawRecord.телефон ?? null,
    country: rawRecord.страна ?? null,
    emailVerified: rawRecord.email_verified ?? false,
    phoneVerified: rawRecord.phone_verified ?? false,
    createdAt: rawRecord.created_at ?? null,
    updatedAt: rawRecord.updated_at ?? null,
  };
}

/**
 * Преобразует типизированный Profile в объект для записи в БД (с русскими ключами)
 */
export function mapProfileToDb(profile: Partial<Profile>): Record<string, any> {
  const dbProfile: Record<string, any> = {};
  
  if (profile.id !== undefined) dbProfile.id = profile.id;
  if (profile.email !== undefined) dbProfile.email = profile.email;
  if (profile.fullName !== undefined) dbProfile['ФИО'] = profile.fullName;
  if (profile.shortName !== undefined) dbProfile.имя = profile.shortName;
  if (profile.role !== undefined) dbProfile.роль = profile.role;
  if (profile.businessId !== undefined) dbProfile.бизнес_id = profile.businessId;
  if (profile.companyCode !== undefined) dbProfile.код_компании = profile.companyCode;
  if (profile.jobTitle !== undefined) dbProfile.должность = profile.jobTitle;
  if (profile.active !== undefined) dbProfile.активен = profile.active;
  if (profile.avatarUrl !== undefined) dbProfile.аватар_url = profile.avatarUrl;
  if (profile.phone !== undefined) dbProfile.телефон = profile.phone;
  if (profile.country !== undefined) dbProfile.страна = profile.country;
  if (profile.emailVerified !== undefined) dbProfile.email_verified = profile.emailVerified;
  if (profile.phoneVerified !== undefined) dbProfile.phone_verified = profile.phoneVerified;
  
  return dbProfile;
}

/**
 * Проверяет, является ли профиль полным (имеет все обязательные поля)
 */
export function isProfileComplete(profile: Profile): boolean {
  return !!(
    profile.fullName &&
    profile.role &&
    profile.businessId
  );
}


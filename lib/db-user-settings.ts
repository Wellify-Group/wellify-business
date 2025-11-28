/**
 * Функции для работы с настройками пользователя в файловой системе
 * 
 * Файлы хранятся как: data/user-settings/{userId}.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import { UserSettings, MonitoringPreferences, DEFAULT_MONITORING_PREFERENCES } from './user-settings';

const USER_SETTINGS_DIR = path.join(process.cwd(), 'data', 'user-settings');

/**
 * Ensures a directory exists, creating it recursively if needed
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Сохраняет настройки пользователя в файловую систему
 * Path structure: data/user-settings/{userId}.json
 */
export async function saveUserSettings(settings: UserSettings): Promise<void> {
  await ensureDirectoryExists(USER_SETTINGS_DIR);
  
  const filename = `${settings.user_id}.json`;
  const filePath = path.join(USER_SETTINGS_DIR, filename);
  
  const settingsData = JSON.stringify(settings, null, 2);
  await fs.writeFile(filePath, settingsData, 'utf-8');
}

/**
 * Получает настройки пользователя
 * @param userId - ID пользователя
 * @returns Настройки пользователя или null, если не найдены
 */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const filename = `${userId}.json`;
  const filePath = path.join(USER_SETTINGS_DIR, filename);
  
  try {
    await fs.access(filePath);
  } catch {
    // Файл не существует, возвращаем null
    return null;
  }
  
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const settings: UserSettings = JSON.parse(fileContent);
    return settings;
  } catch (error) {
    console.error(`Error reading user settings file ${filePath}:`, error);
    return null;
  }
}

/**
 * Получает или создает настройки пользователя с дефолтными значениями
 * @param userId - ID пользователя
 * @param role - Роль пользователя
 * @returns Настройки пользователя
 */
export async function getOrCreateUserSettings(
  userId: string,
  role: 'director' | 'manager'
): Promise<UserSettings> {
  const existing = await getUserSettings(userId);
  
  if (existing) {
    return existing;
  }
  
  // Создаем новые настройки с дефолтными значениями
  const now = new Date().toISOString();
  const newSettings: UserSettings = {
    id: `settings-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    user_id: userId,
    role,
    monitoring_preferences: DEFAULT_MONITORING_PREFERENCES,
    created_at: now,
    updated_at: now,
  };
  
  await saveUserSettings(newSettings);
  return newSettings;
}

/**
 * Обновляет настройки мониторинга пользователя
 * @param userId - ID пользователя
 * @param preferences - Новые настройки мониторинга
 * @returns Обновленные настройки
 */
export async function updateMonitoringPreferences(
  userId: string,
  preferences: Partial<MonitoringPreferences>
): Promise<UserSettings> {
  const existing = await getUserSettings(userId);
  
  if (!existing) {
    throw new Error('User settings not found');
  }
  
  // Объединяем существующие настройки с новыми
  const updatedPreferences: MonitoringPreferences = {
    ...existing.monitoring_preferences,
    ...preferences,
    operationalMetrics: {
      ...existing.monitoring_preferences.operationalMetrics,
      ...preferences.operationalMetrics,
    },
    financialMetrics: {
      ...existing.monitoring_preferences.financialMetrics,
      ...preferences.financialMetrics,
    },
    qualityMetrics: {
      ...existing.monitoring_preferences.qualityMetrics,
      ...preferences.qualityMetrics,
    },
  };
  
  const updated: UserSettings = {
    ...existing,
    monitoring_preferences: updatedPreferences,
    updated_at: new Date().toISOString(),
  };
  
  await saveUserSettings(updated);
  return updated;
}










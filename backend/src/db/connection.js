/**
 * Database Connection Pool
 * PostgreSQL (Render)
 * 
 * Использование:
 * - PostgreSQL: установи DATABASE_URL
 */

import pg from 'pg';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

// Используем PostgreSQL
logger.info('Initializing PostgreSQL connection...');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('DATABASE_URL is not set');
  process.exit(1);
}

// Создаём connection pool
const db = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20, // Максимум соединений в pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Обработка ошибок подключения
db.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Тестовое подключение при старте
(async () => {
  try {
    await db.query('SELECT NOW()');
    logger.info('PostgreSQL database connected successfully');
    
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обновляем триггер handle_new_user (убираем колонку email)
    logger.info('🔧 [CRITICAL] Updating handle_new_user trigger...');
    try {
      await db.query(`
        CREATE OR REPLACE FUNCTION handle_new_user()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        AS $$
        BEGIN
          IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
            RETURN NEW;
          END IF;

          INSERT INTO profiles (
            id,
            first_name,
            last_name,
            middle_name,
            full_name,
            birth_date,
            email_verified,
            phone_verified,
            role,
            language,
            created_at,
            updated_at
          )
          VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'first_name',
            NEW.raw_user_meta_data->>'last_name',
            NEW.raw_user_meta_data->>'middle_name',
            NEW.raw_user_meta_data->>'full_name',
            CASE
              WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL
                   AND NEW.raw_user_meta_data->>'birth_date' != ''
              THEN (NEW.raw_user_meta_data->>'birth_date')::DATE
              ELSE NULL
            END,
            (NEW.email_confirmed_at IS NOT NULL),
            (NEW.phone_confirmed_at IS NOT NULL),
            COALESCE(NEW.raw_user_meta_data->>'role', 'director'),
            COALESCE(NEW.raw_user_meta_data->>'language', 'ru'),
            NOW(),
            NOW()
          );

          RETURN NEW;
        END;
        $$;
      `);
      logger.info('✅ [SUCCESS] Trigger handle_new_user updated successfully');
    } catch (triggerError) {
      logger.error('❌ [CRITICAL ERROR] Failed to update trigger handle_new_user:', {
        message: triggerError.message,
        stack: triggerError.stack,
        code: triggerError.code,
        detail: triggerError.detail
      });
      // НЕ выходим из процесса, но логируем критическую ошибку
    }
    
    // Также исправляем handle_user_update (убираем обновление email)
    logger.info('🔧 [CRITICAL] Updating handle_user_update trigger...');
    try {
      await db.query(`
        CREATE OR REPLACE FUNCTION handle_user_update()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        AS $$
        BEGIN
          IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL) THEN
            UPDATE profiles
            SET email_verified = TRUE,
                updated_at = NOW()
            WHERE id = NEW.id;
          END IF;

          -- УБРАНО: обновление email в profiles (колонки не существует)
          -- IF NEW.email IS DISTINCT FROM OLD.email THEN
          --   UPDATE profiles
          --   SET email = NEW.email,
          --       updated_at = NOW()
          --   WHERE id = NEW.id;
          -- END IF;

          RETURN NEW;
        END;
        $$;
      `);
      logger.info('✅ [SUCCESS] Trigger handle_user_update updated successfully');
    } catch (triggerError) {
      logger.error('❌ [CRITICAL ERROR] Failed to update trigger handle_user_update:', {
        message: triggerError.message,
        stack: triggerError.stack,
        code: triggerError.code,
        detail: triggerError.detail
      });
    }
  } catch (err) {
    logger.error('PostgreSQL database connection failed', err);
    process.exit(1);
  }
})();

export { db };

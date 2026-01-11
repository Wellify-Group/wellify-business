-- Миграция для добавления поддержки Telegram верификации
-- Выполните этот SQL в Render PostgreSQL или через migrate.js

-- 1. Добавляем поля Telegram в таблицу profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS telegram_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
  ADD COLUMN IF NOT EXISTS telegram_last_name TEXT,
  ADD COLUMN IF NOT EXISTS telegram_verified BOOLEAN DEFAULT false;

-- 2. Создаем таблицу для сессий регистрации Telegram
CREATE TABLE IF NOT EXISTS registration_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- SESSION_TOKEN
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  language TEXT DEFAULT 'ru',
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'completed' | 'expired' | 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  telegram_id TEXT,
  phone TEXT
);

-- 3. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_registration_sessions_user_id ON registration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_sessions_status ON registration_sessions(status);
CREATE INDEX IF NOT EXISTS idx_registration_sessions_id ON registration_sessions(id);

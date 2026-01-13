-- Миграция для добавления недостающих колонок в таблицы users и profiles
-- Выполните этот SQL в Render PostgreSQL

-- Добавляем недостающие колонки в таблицу profiles (если их нет)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS middle_name TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS telegram_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
  ADD COLUMN IF NOT EXISTS telegram_last_name TEXT,
  ADD COLUMN IF NOT EXISTS telegram_verified BOOLEAN DEFAULT FALSE;

-- Проверяем, что колонка phone есть в users (она должна быть, но на всякий случай)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Создаем индексы для новых колонок (если нужно)
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

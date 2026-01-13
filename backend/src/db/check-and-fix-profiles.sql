-- Проверка и исправление структуры таблицы profiles
-- Выполните этот SQL в Render PostgreSQL через DBeaver

-- 1. Проверяем текущую структуру таблицы profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Добавляем все недостающие колонки в profiles
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

-- 3. Проверяем структуру после добавления
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Проверяем данные в profiles
SELECT 
  id,
  first_name,
  last_name,
  middle_name,
  full_name,
  birth_date,
  phone,
  telegram_id,
  telegram_username,
  role,
  language,
  created_at
FROM profiles
LIMIT 10;

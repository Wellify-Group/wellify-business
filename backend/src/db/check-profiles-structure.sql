-- Проверка структуры таблицы profiles
-- Выполните этот SQL в DBeaver

-- 1. Проверяем какие колонки есть в profiles
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Если колонок нет, добавляем их
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

-- 3. Проверяем данные в profiles (JOIN с users для полной информации)
SELECT 
  u.id,
  u.email,
  u.phone as user_phone,
  p.first_name,
  p.last_name,
  p.middle_name,
  p.full_name,
  p.birth_date,
  p.phone as profile_phone,
  p.telegram_id,
  p.telegram_username,
  p.role,
  p.language,
  p.created_at
FROM users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

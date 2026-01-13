-- Просмотр данных из таблицы profiles
-- Выполните этот SQL в DBeaver

-- Вариант 1: Просто данные из profiles
SELECT * FROM profiles;

-- Вариант 2: JOIN users и profiles для полной информации
SELECT 
  u.id,
  u.email,
  u.phone as user_phone,
  u.email_confirmed_at,
  u.phone_confirmed_at,
  u.created_at as user_created_at,
  p.first_name,
  p.last_name,
  p.middle_name,
  p.full_name,
  p.birth_date,
  p.phone as profile_phone,
  p.telegram_id,
  p.telegram_username,
  p.telegram_first_name,
  p.telegram_last_name,
  p.telegram_verified,
  p.role,
  p.language,
  p.phone_verified,
  p.email_verified,
  p.created_at as profile_created_at,
  p.updated_at as profile_updated_at
FROM users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Вариант 3: Только профили с заполненными данными
SELECT 
  u.email,
  p.first_name,
  p.last_name,
  p.middle_name,
  p.full_name,
  p.birth_date,
  p.phone,
  p.telegram_id,
  p.telegram_username
FROM users u
INNER JOIN profiles p ON u.id = p.id
WHERE p.first_name IS NOT NULL 
   OR p.last_name IS NOT NULL 
   OR p.telegram_id IS NOT NULL
ORDER BY u.created_at DESC;

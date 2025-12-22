-- =====================================================
-- ИСПРАВЛЕНИЕ ТАБЛИЦЫ email_verifications
-- Выполните этот код в Supabase SQL Editor для DEV проекта
-- =====================================================

-- 1. Добавляем колонку user_id если её нет
ALTER TABLE public.email_verifications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Создаем индекс для user_id если его нет
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id 
  ON public.email_verifications(user_id);

-- 3. Создаем индекс для token_hash если его нет (для быстрого поиска)
CREATE INDEX IF NOT EXISTS idx_email_verifications_token_hash 
  ON public.email_verifications(token_hash);

-- 4. Создаем функцию для подтверждения email
CREATE OR REPLACE FUNCTION confirm_user_email(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = user_id_param;
END;
$$;

-- 5. Проверяем структуру таблицы (для подтверждения)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'email_verifications'
ORDER BY ordinal_position;

-- =====================================================
-- ГОТОВО! 
-- Теперь таблица должна иметь все необходимые колонки:
-- - id
-- - email
-- - token_hash
-- - user_id (может быть NULL)
-- - expires_at
-- - used_at
-- - created_at
-- =====================================================


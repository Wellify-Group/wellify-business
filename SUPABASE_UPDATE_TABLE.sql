-- =====================================================
-- ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕЙ ТАБЛИЦЫ email_verifications
-- Выполните этот код в Supabase SQL Editor
-- =====================================================

-- Добавляем колонку user_id если её нет (для связи с пользователем)
ALTER TABLE public.email_verifications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Создаем индекс для user_id
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id 
  ON public.email_verifications(user_id);

-- Создаем функцию для подтверждения email
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

-- =====================================================
-- ГОТОВО! Таблица обновлена, функция создана
-- =====================================================


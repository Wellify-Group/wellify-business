-- =====================================================
-- ИСПРАВЛЕНИЕ ТАБЛИЦЫ email_verifications
-- Выполните этот SQL в Supabase SQL Editor
-- =====================================================

-- ШАГ 1: Проверяем и исправляем структуру таблицы

-- Если таблица существует с неправильной структурой, исправляем её
DO $$
BEGIN
  -- Добавляем колонку token если её нет (вместо token_hash)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'email_verifications' 
    AND column_name = 'token'
  ) THEN
    -- Если есть token_hash, копируем данные и переименовываем
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'email_verifications' 
      AND column_name = 'token_hash'
    ) THEN
      ALTER TABLE public.email_verifications 
        ADD COLUMN token TEXT;
      
      -- Копируем данные из token_hash в token (если нужно)
      UPDATE public.email_verifications 
      SET token = token_hash 
      WHERE token IS NULL;
      
      -- Удаляем старую колонку
      ALTER TABLE public.email_verifications 
        DROP COLUMN IF EXISTS token_hash;
    ELSE
      -- Просто добавляем колонку token
      ALTER TABLE public.email_verifications 
        ADD COLUMN token TEXT;
    END IF;
  END IF;

  -- Добавляем колонку verified_at если её нет (вместо used_at)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'email_verifications' 
    AND column_name = 'verified_at'
  ) THEN
    -- Если есть used_at, копируем данные и переименовываем
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'email_verifications' 
      AND column_name = 'used_at'
    ) THEN
      ALTER TABLE public.email_verifications 
        ADD COLUMN verified_at TIMESTAMPTZ;
      
      -- Копируем данные из used_at в verified_at
      UPDATE public.email_verifications 
      SET verified_at = used_at 
      WHERE verified_at IS NULL;
      
      -- Удаляем старую колонку
      ALTER TABLE public.email_verifications 
        DROP COLUMN IF EXISTS used_at;
    ELSE
      -- Просто добавляем колонку verified_at
      ALTER TABLE public.email_verifications 
        ADD COLUMN verified_at TIMESTAMPTZ;
    END IF;
  END IF;

  -- Убеждаемся, что token NOT NULL и UNIQUE
  ALTER TABLE public.email_verifications 
    ALTER COLUMN token SET NOT NULL;
  
  -- Создаем уникальный индекс на token если его нет
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'email_verifications' 
    AND indexname = 'email_verifications_token_key'
  ) THEN
    CREATE UNIQUE INDEX email_verifications_token_key 
      ON public.email_verifications(token);
  END IF;

  -- Создаем индексы если их нет
  CREATE INDEX IF NOT EXISTS idx_email_verifications_token 
    ON public.email_verifications(token);
  CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id 
    ON public.email_verifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_email_verifications_email 
    ON public.email_verifications(email);
END;
$$;

-- ШАГ 2: Если таблицы вообще нет, создаём её с нуля
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- ШАГ 3: Включаем RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- ШАГ 4: Проверяем результат
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'email_verifications'
ORDER BY ordinal_position;

-- ГОТОВО! Таблица должна иметь структуру:
-- id (uuid)
-- user_id (uuid)
-- email (text)
-- token (text, unique, not null)
-- created_at (timestamptz)
-- verified_at (timestamptz, nullable)
-- expires_at (timestamptz)


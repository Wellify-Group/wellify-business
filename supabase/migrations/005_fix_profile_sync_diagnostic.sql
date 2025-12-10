-- Диагностика и исправление проблем с синхронизацией профилей
-- Выполните этот скрипт в Supabase SQL Editor для проверки и исправления

-- 1. Проверяем, существуют ли поля в таблице profiles
DO $$ 
BEGIN
  RAISE NOTICE 'Проверка полей в таблице profiles...';
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    RAISE NOTICE 'Добавляем first_name...';
    ALTER TABLE profiles ADD COLUMN first_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    RAISE NOTICE 'Добавляем last_name...';
    ALTER TABLE profiles ADD COLUMN last_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'middle_name'
  ) THEN
    RAISE NOTICE 'Добавляем middle_name...';
    ALTER TABLE profiles ADD COLUMN middle_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'birth_date'
  ) THEN
    RAISE NOTICE 'Добавляем birth_date...';
    ALTER TABLE profiles ADD COLUMN birth_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email_verified'
  ) THEN
    RAISE NOTICE 'Добавляем email_verified...';
    ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. Обновляем функцию handle_new_user с правильным доступом к метаданным
-- ВАЖНО: В Supabase метаданные могут быть в raw_user_meta_data или в user_metadata
-- Проверяем оба варианта
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_middle_name TEXT;
  v_birth_date DATE;
  v_full_name TEXT;
BEGIN
  -- Извлекаем данные из метаданных (проверяем оба варианта)
  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_app_meta_data->>'first_name',
    NULL
  );
  
  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_app_meta_data->>'last_name',
    NULL
  );
  
  v_middle_name := COALESCE(
    NEW.raw_user_meta_data->>'middle_name',
    NEW.raw_app_meta_data->>'middle_name',
    NULL
  );
  
  -- Обрабатываем birth_date
  IF NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN
    BEGIN
      v_birth_date := (NEW.raw_user_meta_data->>'birth_date')::date;
    EXCEPTION WHEN OTHERS THEN
      v_birth_date := NULL;
    END;
  ELSIF NEW.raw_app_meta_data->>'birth_date' IS NOT NULL THEN
    BEGIN
      v_birth_date := (NEW.raw_app_meta_data->>'birth_date')::date;
    EXCEPTION WHEN OTHERS THEN
      v_birth_date := NULL;
    END;
  ELSE
    v_birth_date := NULL;
  END IF;
  
  -- Формируем full_name
  v_full_name := trim(
    coalesce(v_last_name, '') || ' ' ||
    coalesce(v_first_name, '') || ' ' ||
    coalesce(v_middle_name, '')
  );
  
  -- Вставляем или обновляем профиль
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    middle_name,
    full_name,
    birth_date,
    email_verified
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_middle_name,
    v_full_name,
    v_birth_date,
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET
    first_name  = COALESCE(excluded.first_name, profiles.first_name),
    last_name   = COALESCE(excluded.last_name, profiles.last_name),
    middle_name = COALESCE(excluded.middle_name, profiles.middle_name),
    full_name   = COALESCE(excluded.full_name, profiles.full_name),
    birth_date  = COALESCE(excluded.birth_date, profiles.birth_date),
    email       = COALESCE(excluded.email, profiles.email);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Обновляем триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Обновляем функцию sync_email_verified
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at) THEN
    UPDATE public.profiles
    SET email_verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Обновляем триггер для email_verified
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at))
  EXECUTE FUNCTION public.sync_email_verified();

-- 6. Проверяем существующие записи и синхронизируем их
-- Обновляем email_verified для пользователей, у которых email уже подтвержден
UPDATE public.profiles p
SET email_verified = true
FROM auth.users u
WHERE p.id = u.id
  AND u.email_confirmed_at IS NOT NULL
  AND (p.email_verified IS NULL OR p.email_verified = false);

-- 7. Синхронизируем метаданные для существующих пользователей
-- (только для тех, у кого поля пустые)
UPDATE public.profiles p
SET
  first_name = COALESCE(
    p.first_name,
    (SELECT raw_user_meta_data->>'first_name' FROM auth.users WHERE id = p.id),
    NULL
  ),
  last_name = COALESCE(
    p.last_name,
    (SELECT raw_user_meta_data->>'last_name' FROM auth.users WHERE id = p.id),
    NULL
  ),
  middle_name = COALESCE(
    p.middle_name,
    (SELECT raw_user_meta_data->>'middle_name' FROM auth.users WHERE id = p.id),
    NULL
  ),
  birth_date = COALESCE(
    p.birth_date,
    CASE 
      WHEN (SELECT raw_user_meta_data->>'birth_date' FROM auth.users WHERE id = p.id) IS NOT NULL
      THEN (SELECT (raw_user_meta_data->>'birth_date')::date FROM auth.users WHERE id = p.id)
      ELSE NULL
    END,
    NULL
  ),
  full_name = COALESCE(
    p.full_name,
    trim(
      coalesce((SELECT raw_user_meta_data->>'last_name' FROM auth.users WHERE id = p.id), '') || ' ' ||
      coalesce((SELECT raw_user_meta_data->>'first_name' FROM auth.users WHERE id = p.id), '') || ' ' ||
      coalesce((SELECT raw_user_meta_data->>'middle_name' FROM auth.users WHERE id = p.id), '')
    ),
    NULL
  )
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = p.id);


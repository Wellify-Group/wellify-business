-- Миграция: добавление колонки locale в таблицу profiles
-- Выполните этот SQL в Supabase SQL Editor

-- 1. Добавляем колонку locale в profiles, если её нет
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'locale'
  ) THEN
    ALTER TABLE profiles ADD COLUMN locale TEXT DEFAULT 'ru' NOT NULL;
  END IF;
END $$;

-- 2. Обновляем функцию handle_new_user для синхронизации locale из метаданных
-- Вариант: SQL-триггер (используется этот подход)
-- Триггер автоматически копирует locale из raw_user_meta_data в profiles.locale при создании пользователя
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_middle_name TEXT;
  v_full_name TEXT;
  v_birth_date DATE;
  v_locale TEXT;
BEGIN
  -- Извлекаем данные из raw_user_meta_data (данные из options.data в signUp)
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  v_last_name := NEW.raw_user_meta_data->>'last_name';
  v_middle_name := NEW.raw_user_meta_data->>'middle_name';
  
  -- Получаем locale из метаданных, по умолчанию 'ru'
  -- Маппинг: 'ua' -> 'uk' (для совместимости с API)
  v_locale := COALESCE(
    CASE 
      WHEN NEW.raw_user_meta_data->>'locale' = 'ua' THEN 'uk'
      WHEN NEW.raw_user_meta_data->>'locale' IN ('ru', 'uk', 'en') THEN NEW.raw_user_meta_data->>'locale'
      ELSE NULL
    END,
    'ru'  -- значение по умолчанию
  );
  
  -- Получаем full_name из метаданных или формируем из компонентов
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    trim(
      coalesce(v_last_name, '') || ' ' ||
      coalesce(v_first_name, '') || ' ' ||
      coalesce(v_middle_name, '')
    )
  );
  
  -- Обрабатываем дату рождения (поддерживаем birth_date и dob для обратной совместимости)
  IF NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN
    BEGIN
      v_birth_date := (NEW.raw_user_meta_data->>'birth_date')::date;
    EXCEPTION WHEN OTHERS THEN
      v_birth_date := NULL;
    END;
  ELSIF NEW.raw_user_meta_data->>'dob' IS NOT NULL THEN
    BEGIN
      v_birth_date := (NEW.raw_user_meta_data->>'dob')::date;
    EXCEPTION WHEN OTHERS THEN
      v_birth_date := NULL;
    END;
  ELSE
    v_birth_date := NULL;
  END IF;
  
  -- Вставляем или обновляем профиль
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    middle_name,
    full_name,
    birth_date,
    email_verified,
    locale
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_middle_name,
    v_full_name,
    v_birth_date,
    false,  -- email_verified = false при создании, обновится триггером при подтверждении
    v_locale
  )
  ON CONFLICT (id) DO UPDATE
  SET
    first_name  = COALESCE(excluded.first_name, profiles.first_name),
    last_name   = COALESCE(excluded.last_name, profiles.last_name),
    middle_name = COALESCE(excluded.middle_name, profiles.middle_name),
    full_name   = COALESCE(excluded.full_name, profiles.full_name),
    birth_date  = COALESCE(excluded.birth_date, profiles.birth_date),
    email       = COALESCE(excluded.email, profiles.email),
    locale      = COALESCE(excluded.locale, profiles.locale);  -- Обновляем locale только если он был передан
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Создаём функцию для обновления locale из метаданных (для существующих пользователей)
-- Можно использовать для синхронизации locale при логине/обновлении профиля
CREATE OR REPLACE FUNCTION public.sync_user_locale()
RETURNS TRIGGER AS $$
DECLARE
  v_locale TEXT;
BEGIN
  -- Обновляем locale из метаданных, если он изменился
  IF NEW.raw_user_meta_data->>'locale' IS NOT NULL THEN
    v_locale := CASE 
      WHEN NEW.raw_user_meta_data->>'locale' = 'ua' THEN 'uk'
      WHEN NEW.raw_user_meta_data->>'locale' IN ('ru', 'uk', 'en') THEN NEW.raw_user_meta_data->>'locale'
      ELSE NULL
    END;
    
    IF v_locale IS NOT NULL THEN
      UPDATE public.profiles
      SET locale = v_locale
      WHERE id = NEW.id AND (profiles.locale IS NULL OR profiles.locale != v_locale);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Создаём триггер для синхронизации locale при обновлении метаданных пользователя
DROP TRIGGER IF EXISTS on_auth_user_metadata_updated ON auth.users;

CREATE TRIGGER on_auth_user_metadata_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'locale' IS DISTINCT FROM OLD.raw_user_meta_data->>'locale')
  EXECUTE FUNCTION public.sync_user_locale();

-- 5. Синхронизируем locale для существующих пользователей (опционально)
-- Обновляем locale из метаданных для пользователей, у которых locale ещё не установлен
UPDATE public.profiles p
SET locale = CASE 
  WHEN u.raw_user_meta_data->>'locale' = 'ua' THEN 'uk'
  WHEN u.raw_user_meta_data->>'locale' IN ('ru', 'uk', 'en') THEN u.raw_user_meta_data->>'locale'
  ELSE 'ru'
END
FROM auth.users u
WHERE p.id = u.id
  AND u.raw_user_meta_data->>'locale' IS NOT NULL
  AND (p.locale IS NULL OR p.locale = 'ru');  -- Обновляем только если locale не установлен или установлен по умолчанию

-- Готово! Теперь:
-- 1. При создании пользователя через signUp locale автоматически копируется из метаданных в profiles.locale
-- 2. При обновлении метаданных пользователя locale синхронизируется автоматически
-- 3. По умолчанию используется 'ru', если locale не указан


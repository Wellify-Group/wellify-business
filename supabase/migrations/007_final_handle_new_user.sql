-- Финальная версия функции handle_new_user для заполнения профиля из метаданных
-- Выполните этот SQL в Supabase SQL Editor

-- 1. Убеждаемся, что все поля существуют
DO $$ 
BEGIN
  -- Добавляем first_name, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name TEXT;
  END IF;

  -- Добавляем last_name, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name TEXT;
  END IF;

  -- Добавляем middle_name, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'middle_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN middle_name TEXT;
  END IF;

  -- Добавляем birth_date, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN birth_date DATE;
  END IF;

  -- Добавляем email_verified, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. Обновляем функцию handle_new_user
-- Эта функция автоматически вызывается при создании нового пользователя в auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_middle_name TEXT;
  v_full_name TEXT;
  v_birth_date DATE;
BEGIN
  -- Извлекаем данные из raw_user_meta_data (данные из options.data в signUp)
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  v_last_name := NEW.raw_user_meta_data->>'last_name';
  v_middle_name := NEW.raw_user_meta_data->>'middle_name';
  
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
    false  -- email_verified = false при создании, обновится триггером при подтверждении
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

-- 3. Убеждаемся, что триггер создан
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Создаём/обновляем функцию для синхронизации email_verified
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

-- 5. Создаём/обновляем триггер для синхронизации email_verified
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at))
  EXECUTE FUNCTION public.sync_email_verified();

-- Готово! Теперь при создании пользователя через signUp:
-- 1. Автоматически создастся запись в profiles
-- 2. Заполнятся first_name, last_name, middle_name, full_name, birth_date из метаданных
-- 3. email_verified будет false до подтверждения email
-- 4. После подтверждения email email_verified автоматически станет true


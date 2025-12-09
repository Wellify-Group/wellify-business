-- Миграция: добавление полей first_name, last_name, middle_name, birth_date в profiles
-- и обновление триггеров для синхронизации данных

-- Добавляем поля, если их еще нет
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
END $$;

-- Обновляем функцию handle_new_user для заполнения всех полей из метаданных
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'middle_name',
    trim(
      coalesce(NEW.raw_user_meta_data->>'last_name', '') || ' ' ||
      coalesce(NEW.raw_user_meta_data->>'first_name', '') || ' ' ||
      coalesce(NEW.raw_user_meta_data->>'middle_name', '')
    ),
    CASE 
      WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'birth_date')::date
      ELSE NULL
    END,
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET
    first_name  = excluded.first_name,
    last_name   = excluded.last_name,
    middle_name = excluded.middle_name,
    full_name   = excluded.full_name,
    birth_date  = excluded.birth_date;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновляем триггер на таблице auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Создаём функцию для синхронизации email_verified
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.profiles
    SET email_verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаём триггер для синхронизации email_verified
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION public.sync_email_verified();


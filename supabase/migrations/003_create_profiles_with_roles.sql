-- Миграция: создание таблицы profiles с ролями и полями для верификации телефона
-- Если таблица profiles уже существует, добавляем недостающие поля

-- Добавляем поля, если их еще нет
DO $$ 
BEGIN
  -- Добавляем role, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT;
  END IF;

  -- Добавляем phone, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;

  -- Добавляем phone_verified, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_verified BOOLEAN DEFAULT false;
  END IF;

  -- Добавляем phone_verification_code, если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone_verification_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_verification_code TEXT;
  END IF;
END $$;

-- Добавляем constraint для role, если его еще нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IS NULL OR role IN ('director', 'manager', 'employee'));
  END IF;
END $$;

-- Создаем индекс для role, если его еще нет
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Обновляем существующие записи: устанавливаем phone_verified = false, если NULL
UPDATE profiles 
SET phone_verified = COALESCE(phone_verified, false)
WHERE phone_verified IS NULL;

-- Обновляем функцию handle_new_user для поддержки роли
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', NULL),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Добавление полей для верификации email и телефона в таблицу profiles

-- Добавляем поля email_verified и phone_verified, если их еще нет
DO $$ 
BEGIN
  -- Проверяем и добавляем email_verified
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;

  -- Проверяем и добавляем phone_verified
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Устанавливаем значения по умолчанию для существующих записей
UPDATE profiles 
SET email_verified = COALESCE(email_verified, false),
    phone_verified = COALESCE(phone_verified, false)
WHERE email_verified IS NULL OR phone_verified IS NULL;


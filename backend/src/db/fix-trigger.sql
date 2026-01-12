-- Исправление триггера handle_new_user()
-- Удаляем колонку email, которой нет в таблице profiles

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO profiles (
    id,
    first_name,
    last_name,
    middle_name,
    full_name,
    birth_date,
    email_verified,
    phone_verified,
    role,
    language,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'middle_name',
    NEW.raw_user_meta_data->>'full_name',
    CASE
      WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL
           AND NEW.raw_user_meta_data->>'birth_date' != ''
      THEN (NEW.raw_user_meta_data->>'birth_date')::DATE
      ELSE NULL
    END,
    (NEW.email_confirmed_at IS NOT NULL),
    (NEW.phone_confirmed_at IS NOT NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'director'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'ru'),
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

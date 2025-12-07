-- Trigger: Create/update profile when email is confirmed
-- Execute this SQL in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This replaces the existing trigger to work on email confirmation instead of user creation

-- Function, которая создаёт/обновляет профиль при подтверждении e-mail
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на auth.users: срабатывает при первом заполнении email_confirmed_at
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
EXECUTE FUNCTION public.handle_user_email_confirmed();


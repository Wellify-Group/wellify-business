-- supabase/migrations/011_ensure_email_verified_sync.sql
-- Убеждаемся, что триггер sync_email_verified работает правильно

-- 1. Проверяем и обновляем функцию sync_email_verified
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновляем email_verified в profiles когда email_confirmed_at устанавливается
  IF NEW.email_confirmed_at IS NOT NULL 
     AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at) 
  THEN
    UPDATE public.profiles
    SET email_verified = true, updated_at = NOW()
    WHERE id = NEW.id;
    
    -- Логируем для отладки
    RAISE NOTICE 'Email verified for user %: email_confirmed_at = %', NEW.id, NEW.email_confirmed_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Удаляем старый триггер если существует
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

-- 3. Создаём триггер заново
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at))
  EXECUTE FUNCTION public.sync_email_verified();

-- 4. Синхронизируем существующие записи (на случай если триггер не сработал)
-- Обновляем email_verified для всех пользователей, у которых email уже подтверждён
UPDATE public.profiles p
SET email_verified = true, updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND u.email_confirmed_at IS NOT NULL
  AND (p.email_verified IS NULL OR p.email_verified = false);

-- 5. Комментарий для документации
COMMENT ON FUNCTION public.sync_email_verified() IS 
'Автоматически обновляет profiles.email_verified = true когда auth.users.email_confirmed_at устанавливается';

COMMENT ON TRIGGER on_auth_user_email_confirmed ON auth.users IS 
'Триггер для автоматической синхронизации email_verified при подтверждении email';


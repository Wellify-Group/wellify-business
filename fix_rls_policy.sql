-- =====================================================
-- ИСПРАВЛЕНИЕ RLS ПОЛИТИКИ ДЛЯ email_verifications
-- Выполните этот SQL в Supabase SQL Editor
-- =====================================================

-- Удаляем все старые политики на email_verifications
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_verifications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.email_verifications', pol.policyname);
  END LOOP;
END;
$$;

-- Создаем политику для service_role (чтобы API мог работать)
CREATE POLICY "Service role can manage email_verifications"
ON public.email_verifications
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Проверяем результат
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'email_verifications';

-- ГОТОВО! Теперь service_role может вставлять, обновлять и удалять записи в email_verifications


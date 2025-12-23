-- =====================================================
-- ПРОСТОЕ ИСПРАВЛЕНИЕ RLS ПОЛИТИКИ
-- Выполните этот SQL в Supabase SQL Editor
-- =====================================================

-- Удаляем старую политику если она есть
DROP POLICY IF EXISTS "Service role can manage email_verifications" ON public.email_verifications;

-- Создаем политику для service_role
CREATE POLICY "Service role can manage email_verifications"
ON public.email_verifications
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ГОТОВО! Теперь service_role может работать с таблицей email_verifications

-- Миграция: добавление RLS-политики для обновления phone и phone_verified в profiles
-- Выполните этот SQL в Supabase SQL Editor

-- Разрешаем пользователю обновлять phone и phone_verified только в своём профиле
-- Эта политика дополняет существующую политику "Users can update own profile"
-- если она уже существует и покрывает все поля

-- Проверяем, существует ли уже политика для UPDATE
DO $$
BEGIN
  -- Если политика "Users can update own profile phone" уже существует, пропускаем создание
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update own profile phone'
  ) THEN
    -- Создаём политику для обновления phone и phone_verified
    CREATE POLICY "Users can update own profile phone"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING ( auth.uid() = id )
    WITH CHECK ( auth.uid() = id );
    
    RAISE NOTICE 'Policy "Users can update own profile phone" created';
  ELSE
    RAISE NOTICE 'Policy "Users can update own profile phone" already exists, skipping';
  END IF;
END $$;

-- Комментарий к политике
COMMENT ON POLICY "Users can update own profile phone" ON public.profiles IS 
'Разрешает аутентифицированным пользователям обновлять phone и phone_verified только в своём профиле. Используется при верификации телефона через Twilio.';


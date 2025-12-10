-- Миграция: создание RPC-функции verify_phone_and_update_profile
-- Выполните этот SQL в Supabase SQL Editor

-- RPC-функция для обновления phone_verified в profiles после успешной верификации через Twilio
CREATE OR REPLACE FUNCTION public.verify_phone_and_update_profile(
  p_user_id UUID,
  p_phone TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Обновляем phone_verified и phone в profiles
  UPDATE public.profiles
  SET 
    phone_verified = true,
    phone = p_phone,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Если профиль не найден, создаём его (на случай, если пользователь создан, но профиль ещё нет)
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, phone, phone_verified, updated_at)
    VALUES (p_user_id, p_phone, true, NOW())
    ON CONFLICT (id) DO UPDATE
    SET 
      phone_verified = true,
      phone = p_phone,
      updated_at = NOW();
  END IF;
END;
$$;

-- Комментарий к функции
COMMENT ON FUNCTION public.verify_phone_and_update_profile IS 
'Обновляет phone_verified = true и phone в profiles после успешной верификации через Twilio. Используется в API endpoint /api/auth/phone/verify-code.';


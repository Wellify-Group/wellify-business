-- Миграция: создание/обновление RPC-функции verify_phone_and_update_profile
-- Выполните этот SQL в Supabase SQL Editor

-- RPC-функция для обновления phone_verified в profiles после успешной верификации через Twilio
-- Использует UPSERT для надёжности (создаст запись, если её нет, или обновит существующую)
CREATE OR REPLACE FUNCTION public.verify_phone_and_update_profile(
  p_user_id UUID,
  p_phone TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Используем UPSERT для надёжности (аналогично шагу 2 с email)
  -- Это гарантирует, что запись будет создана или обновлена в любом случае
  INSERT INTO public.profiles (id, phone, phone_verified, updated_at)
  VALUES (p_user_id, p_phone, true, NOW())
  ON CONFLICT (id) DO UPDATE
  SET 
    phone_verified = true,
    phone = p_phone,
    updated_at = NOW();
  
  -- Логируем для отладки
  RAISE NOTICE 'Phone verified for user %: phone = %, phone_verified = true', p_user_id, p_phone;
END;
$$;

-- Комментарий к функции
COMMENT ON FUNCTION public.verify_phone_and_update_profile IS 
'Обновляет phone_verified = true и phone в profiles после успешной верификации через Twilio (check.status === "approved"). Использует UPSERT для надёжности. Используется в API endpoint /api/auth/phone/verify-code.';


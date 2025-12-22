-- =====================================================
-- SQL КОД ДЛЯ SUPABASE - ПОДТВЕРЖДЕНИЕ EMAIL ЧЕРЕЗ КАСТОМНЫЕ ТОКЕНЫ
-- Выполните этот код в Supabase SQL Editor для DEV и PRODUCTION проектов
-- =====================================================

-- 1. Создание таблицы email_verifications для хранения кастомных токенов
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- Включаем RLS (Row Level Security)
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- RLS политики
-- Service role может делать все (для админских операций)
CREATE POLICY "Service role can manage email_verifications"
  ON email_verifications FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Пользователи могут читать свои записи верификации
CREATE POLICY "Users can view own email_verifications"
  ON email_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Создание функции для подтверждения email (устанавливает email_confirmed_at)
CREATE OR REPLACE FUNCTION confirm_user_email(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Обновляем email_confirmed_at в auth.users
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = user_id_param;
END;
$$;

-- Комментарий к функции
COMMENT ON FUNCTION confirm_user_email(UUID) IS 
'Подтверждает email пользователя, устанавливая email_confirmed_at = NOW(). Используется для кастомного подтверждения email через Railway.';

-- =====================================================
-- ГОТОВО! Таблица и функция созданы.
-- =====================================================


-- =====================================================
-- ПОЛНЫЙ SQL КОД - ВЫПОЛНИТЕ ВСЁ СРАЗУ
-- Скопируйте весь код ниже и выполните в Supabase SQL Editor
-- =====================================================

-- ШАГ 1: Создание таблицы email_verifications
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
CREATE POLICY "Service role can manage email_verifications"
  ON email_verifications FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view own email_verifications"
  ON email_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- ШАГ 2: Создание функции для подтверждения email
CREATE OR REPLACE FUNCTION confirm_user_email(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = user_id_param;
END;
$$;

-- =====================================================
-- ГОТОВО! Нажмите "Run" или CTRL + Enter
-- =====================================================


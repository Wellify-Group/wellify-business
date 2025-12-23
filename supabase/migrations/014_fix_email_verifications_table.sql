-- Migration: Fix email_verifications table to use token instead of token_hash
-- This migration fixes the table structure to match the API code

-- Удаляем старую таблицу если она существует с неправильной структурой
DROP TABLE IF EXISTS public.email_verifications CASCADE;

-- Создаем таблицу с правильной структурой
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,  -- ИСПРАВЛЕНО: используем token вместо token_hash
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified_at TIMESTAMPTZ,  -- ИСПРАВЛЕНО: используем verified_at вместо used_at
  expires_at TIMESTAMPTZ NOT NULL
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_email_verifications_token 
  ON public.email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id 
  ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email 
  ON public.email_verifications(email);

-- Включаем RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Политики RLS (только service_role может управлять)
-- Политики не нужны, так как используется service_role через API


------------------------------------------------------------
-- ПОЛНАЯ СХЕМА БАЗЫ ДАННЫХ WELLIFY BUSINESS
-- PostgreSQL для Render
-- Выполните весь этот SQL в PostgreSQL (Render)
------------------------------------------------------------

------------------------------------------------------------
-- 0. УДАЛЕНИЕ ВСЕХ СТАРЫХ ТРИГГЕРОВ И ФУНКЦИЙ
-- КРИТИЧНО: Удаляем все триггеры, которые могут вызывать ошибки
------------------------------------------------------------

-- Удаляем все триггеры на таблице users
DROP TRIGGER IF EXISTS on_user_created ON users CASCADE;
DROP TRIGGER IF EXISTS on_user_updated ON users CASCADE;
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;

-- Удаляем все триггеры на таблице profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles CASCADE;

-- Удаляем все триггеры на других таблицах
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses CASCADE;
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations CASCADE;
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff CASCADE;
DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts CASCADE;
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions CASCADE;
DROP TRIGGER IF EXISTS update_support_sessions_updated_at ON support_sessions CASCADE;

-- Удаляем все функции триггеров
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_user_update() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

------------------------------------------------------------
-- 0.1. Расширения для UUID
------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

------------------------------------------------------------
-- 1. ПОЛЬЗОВАТЕЛИ И ПРОФИЛИ
------------------------------------------------------------

-- Таблица пользователей (заменяет auth.users из Supabase)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_confirmed_at TIMESTAMPTZ,
  phone TEXT,
  phone_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ
);

-- Таблица профилей (1:1 с users)
-- ВАЖНО: email НЕ хранится в profiles, только в users!
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  full_name TEXT,
  phone TEXT,
  birth_date DATE,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  role TEXT,
  language TEXT DEFAULT 'ru',
  telegram_id TEXT,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  telegram_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

------------------------------------------------------------
-- 1.2. Сессии регистрации для связки с Telegram
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS registration_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  language TEXT DEFAULT 'ru',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  telegram_id TEXT,
  phone TEXT
);

CREATE INDEX IF NOT EXISTS registration_sessions_user_id_idx
  ON registration_sessions (user_id);

CREATE INDEX IF NOT EXISTS registration_sessions_status_idx
  ON registration_sessions (status);

------------------------------------------------------------
-- 1.4. Подтверждение email (Railway + Resend flow)
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token
  ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id
  ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email
  ON email_verifications(email);

------------------------------------------------------------
-- 1.5. Функция для подтверждения email (устанавливает email_confirmed_at)
------------------------------------------------------------

CREATE OR REPLACE FUNCTION confirm_user_email(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET email_confirmed_at = NOW()
  WHERE id = user_id_param;
  
  UPDATE profiles
  SET email_verified = TRUE,
      updated_at = NOW()
  WHERE id = user_id_param;
END;
$$;

------------------------------------------------------------
-- 2. Бизнес, точки, персонал, доступы
------------------------------------------------------------

-- 2.1. Бизнесы / компании
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  название TEXT NOT NULL,
  юридическое_название TEXT,
  страна TEXT,
  город TEXT,
  адрес TEXT,
  часовой_пояс TEXT DEFAULT 'Europe/Kiev',
  код_компании TEXT,
  активен BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_код_компании
  ON businesses (код_компании);

-- 2.2. Локации / точки
-- Удаляем старую таблицу, если она существует со старой структурой
DROP TABLE IF EXISTS location_staff CASCADE;
DROP TABLE IF EXISTS location_managers CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  код_точки TEXT NOT NULL,
  название TEXT NOT NULL,
  адрес TEXT,
  тип TEXT,
  активна BOOLEAN NOT NULL DEFAULT TRUE,
  менеджер_ключ TEXT,
  код_компании TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, код_точки)
);

CREATE INDEX idx_locations_код_точки
  ON locations (код_точки);

CREATE INDEX IF NOT EXISTS idx_locations_менеджер_ключ
  ON locations (менеджер_ключ);

CREATE INDEX IF NOT EXISTS idx_locations_код_компании
  ON locations (код_компании);

-- 2.3. Персонал
-- Удаляем старую таблицу staff, если она существует
DROP TABLE IF EXISTS location_staff CASCADE;
DROP TABLE IF EXISTS location_managers CASCADE;
DROP TABLE IF EXISTS shift_reports CASCADE;
DROP TABLE IF EXISTS shift_tasks CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS shift_events CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  роль TEXT NOT NULL CHECK (роль IN ('директор','менеджер','сотрудник')),
  должность TEXT,
  ставка_час NUMERIC(10,2),
  пинкод TEXT,
  can_manage_staff BOOLEAN DEFAULT FALSE,
  активен BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_пинкод
  ON staff (пинкод);

CREATE INDEX IF NOT EXISTS idx_staff_business_id
  ON staff (business_id);

CREATE INDEX IF NOT EXISTS idx_staff_location_id
  ON staff (location_id);

-- 2.4. Привязка менеджеров к точкам
CREATE TABLE IF NOT EXISTS location_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  can_manage_staff BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (location_id, staff_id)
);

CREATE INDEX IF NOT EXISTS location_managers_business_id_idx
  ON location_managers (business_id);

CREATE INDEX IF NOT EXISTS location_managers_location_id_idx
  ON location_managers (location_id);

CREATE INDEX IF NOT EXISTS location_managers_staff_id_idx
  ON location_managers (staff_id);

-- 2.5. Привязка сотрудников к точкам
CREATE TABLE IF NOT EXISTS location_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (location_id, staff_id)
);

CREATE INDEX IF NOT EXISTS location_staff_business_id_idx
  ON location_staff (business_id);

CREATE INDEX IF NOT EXISTS location_staff_location_id_idx
  ON location_staff (location_id);

CREATE INDEX IF NOT EXISTS location_staff_staff_id_idx
  ON location_staff (staff_id);

------------------------------------------------------------
-- 3. Смены, заказы, события, проблемы, задачи, отчёты
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  сотрудник_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  менеджер_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  статус TEXT NOT NULL CHECK (статус IN ('открыта','закрыта','черновик')),
  время_начала TIMESTAMPTZ NOT NULL,
  время_конца TIMESTAMPTZ,
  план_выручка NUMERIC(12,2),
  факт_выручка NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shifts_business_id_idx
  ON shifts (business_id);

CREATE INDEX IF NOT EXISTS shifts_location_id_idx
  ON shifts (location_id);

CREATE INDEX IF NOT EXISTS shifts_сотрудник_id_idx
  ON shifts (сотрудник_id);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  номер_чека TEXT,
  время_чека TIMESTAMPTZ NOT NULL,
  сумма NUMERIC(12,2) NOT NULL,
  способ_оплаты TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_business_id_idx
  ON orders (business_id);

CREATE INDEX IF NOT EXISTS orders_location_id_idx
  ON orders (location_id);

CREATE INDEX IF NOT EXISTS orders_shift_id_idx
  ON orders (shift_id);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  товар_id TEXT,
  название TEXT NOT NULL,
  количество NUMERIC(10,3) NOT NULL DEFAULT 1,
  цена NUMERIC(12,2) NOT NULL,
  сумма NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx
  ON order_items (order_id);

CREATE TABLE IF NOT EXISTS shift_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  тип TEXT NOT NULL,
  описание TEXT,
  уровень TEXT,
  meta JSONB,
  создано_в TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shift_events_shift_id_idx
  ON shift_events (shift_id);

CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  автор_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  категория TEXT NOT NULL,
  заголовок TEXT NOT NULL,
  описание TEXT,
  статус TEXT NOT NULL DEFAULT 'новая',
  срочность TEXT,
  создано_в TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  обновлено_в TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS problems_business_id_idx
  ON problems (business_id);

CREATE INDEX IF NOT EXISTS problems_location_id_idx
  ON problems (location_id);

CREATE INDEX IF NOT EXISTS problems_shift_id_idx
  ON problems (shift_id);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  название TEXT NOT NULL,
  описание TEXT,
  тип TEXT,
  активна BOOLEAN NOT NULL DEFAULT TRUE,
  порядок INTEGER,
  создано_в TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  обновлено_в TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_business_id_idx
  ON tasks (business_id);

CREATE TABLE IF NOT EXISTS shift_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  название TEXT NOT NULL,
  описание TEXT,
  обязательна BOOLEAN NOT NULL DEFAULT TRUE,
  статус TEXT NOT NULL DEFAULT 'ожидает',
  выполнено_в TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS shift_tasks_shift_id_idx
  ON shift_tasks (shift_id);

CREATE TABLE IF NOT EXISTS shift_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  дата DATE NOT NULL,
  сотрудник_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  менеджер_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  план_выручка NUMERIC(12,2),
  факт_выручка NUMERIC(12,2),
  колво_чеков INTEGER,
  средний_чек NUMERIC(12,2),
  задач_выполнено INTEGER,
  задач_всего INTEGER,
  проблем_критично INTEGER,
  проблем_всего INTEGER,
  комментарий TEXT,
  создано_в TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shift_reports_business_id_idx
  ON shift_reports (business_id);

CREATE INDEX IF NOT EXISTS shift_reports_location_id_idx
  ON shift_reports (location_id);

CREATE INDEX IF NOT EXISTS shift_reports_shift_id_idx
  ON shift_reports (shift_id);

------------------------------------------------------------
-- ГОТОВО! Все таблицы и функции созданы
-- Схема адаптирована для PostgreSQL на Render
------------------------------------------------------------

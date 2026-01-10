-- SQLite Schema для Cloudflare D1
-- Адаптировано из PostgreSQL schema для совместимости с SQLite/D1

-- Включаем поддержку FOREIGN KEYS
PRAGMA foreign_keys = ON;

-- Функция для генерации UUID (SQLite не имеет uuid_generate_v4)
-- Используется в приложении через JavaScript, но можем создать хранимую функцию
-- Для D1 используем TEXT для хранения UUID

-- Таблица пользователей (заменяет auth.users из Supabase)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- UUID как TEXT
  email TEXT UNIQUE NOT NULL,
  email_verified INTEGER DEFAULT 0, -- BOOLEAN -> INTEGER (0/1)
  password_hash TEXT, -- bcrypt hash
  phone TEXT,
  phone_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL, -- TIMESTAMPTZ -> TEXT
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL,
  last_sign_in_at TEXT,
  raw_user_meta_data TEXT DEFAULT '{}', -- JSONB -> TEXT (JSON)
  raw_app_meta_data TEXT DEFAULT '{}'
);

-- Таблица профилей (заменяет public.profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('director', 'manager', 'employee')),
  language TEXT DEFAULT 'uk' CHECK (language IN ('ru', 'uk', 'en', 'ua')),
  phone TEXT,
  phone_verified INTEGER DEFAULT 0,
  email_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Таблица для email верификации
CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY, -- UUID как TEXT
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  verified_at TEXT,
  expires_at TEXT NOT NULL
);

-- Таблица для phone верификации
CREATE TABLE IF NOT EXISTS phone_verification_attempts (
  phone TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'signup',
  attempts_count INTEGER DEFAULT 0,
  last_sent_at TEXT,
  verification_code TEXT,
  code_expires_at TEXT,
  PRIMARY KEY (phone, action)
);

-- Таблица для password reset
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY, -- UUID как TEXT
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  used_at TEXT,
  expires_at TEXT NOT NULL
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);

-- Триггер для автоматического обновления updated_at для users
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Триггер для автоматического обновления updated_at для profiles
CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at 
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE profiles SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Таблица businesses (бизнесы/компании)
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY, -- UUID как TEXT
  owner_profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  название TEXT NOT NULL,
  код_компании TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Таблица staff (сотрудники компании)
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY, -- UUID как TEXT
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
  роль TEXT NOT NULL CHECK (роль IN ('директор', 'менеджер', 'сотрудник')),
  должность TEXT,
  активен INTEGER DEFAULT 1, -- BOOLEAN -> INTEGER
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Таблица user_subscriptions (Stripe подписки)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY, -- UUID как TEXT
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT,
  plan_type TEXT,
  current_period_start TEXT, -- TIMESTAMPTZ -> TEXT
  current_period_end TEXT,
  cancel_at_period_end INTEGER DEFAULT 0, -- BOOLEAN -> INTEGER
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Таблица locations (точки/локации)
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY, -- UUID как TEXT
  business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  access_code TEXT,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Таблица shifts (смены)
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY, -- UUID как TEXT
  location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  employee_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  clock_in TEXT DEFAULT (datetime('now')), -- TIMESTAMPTZ -> TEXT
  clock_out TEXT,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Таблица support_sessions (сессии поддержки)
CREATE TABLE IF NOT EXISTS support_sessions (
  id TEXT PRIMARY KEY, -- UUID как TEXT
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  telegram_chat_id TEXT UNIQUE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Таблица support_messages (сообщения поддержки)
CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY, -- UUID как TEXT
  session_id TEXT REFERENCES support_sessions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  message_id TEXT,
  from_user TEXT NOT NULL CHECK (from_user IN ('user', 'support')),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Индексы для новых таблиц
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_businesses_code ON businesses(код_компании);
CREATE INDEX IF NOT EXISTS idx_staff_profile ON staff(profile_id);
CREATE INDEX IF NOT EXISTS idx_staff_business ON staff(business_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_locations_business ON locations(business_id);
CREATE INDEX IF NOT EXISTS idx_shifts_location ON shifts(location_id);
CREATE INDEX IF NOT EXISTS idx_shifts_employee ON shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_business ON shifts(business_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_support_sessions_user ON support_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_sessions_telegram ON support_sessions(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_session ON support_messages(session_id);

-- Триггеры для updated_at на новых таблицах
CREATE TRIGGER IF NOT EXISTS update_businesses_updated_at 
  AFTER UPDATE ON businesses
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE businesses SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_staff_updated_at 
  AFTER UPDATE ON staff
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE staff SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_user_subscriptions_updated_at 
  AFTER UPDATE ON user_subscriptions
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE user_subscriptions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_locations_updated_at 
  AFTER UPDATE ON locations
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE locations SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_shifts_updated_at 
  AFTER UPDATE ON shifts
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE shifts SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_support_sessions_updated_at 
  AFTER UPDATE ON support_sessions
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE support_sessions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

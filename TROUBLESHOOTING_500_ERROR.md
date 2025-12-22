# 🔍 Диагностика ошибки 500 при отправке письма

## ❌ Текущая проблема
При попытке регистрации возникает ошибка 500 в `/api/auth/send-custom-email-confirmation`.

## ✅ Шаги диагностики

### 1. Проверка таблицы `email_verifications` в Supabase

**Выполните в Supabase SQL Editor (для DEV проекта):**

```sql
-- Проверка существования таблицы
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'email_verifications'
);

-- Проверка структуры таблицы (должны быть колонки: token_hash, used_at, user_id может быть NULL)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'email_verifications'
ORDER BY ordinal_position;
```

**Если таблицы нет или структура неправильная, выполните:**

```sql
-- Удаляем старую таблицу, если она существует со старой структурой
DROP TABLE IF EXISTS email_verifications CASCADE;

-- Создаем таблицу с правильной структурой
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- МОЖЕТ БЫТЬ NULL
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE, -- Хеш токена (SHA256)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  used_at TIMESTAMPTZ, -- Когда токен был использован
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_email_verifications_token_hash ON email_verifications(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "Service role can manage email_verifications"
  ON email_verifications FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view own email_verifications"
  ON email_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Функция для подтверждения email
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
```

### 2. Проверка переменных окружения в Vercel

**В Vercel Dashboard → Settings → Environment Variables проверьте наличие:**

✅ **Для Preview/Development окружения:**
- `RESEND_API_KEY` (должен быть установлен)
- `EMAIL_FROM` (опционально, по умолчанию `wellifybusiness@wellifyglobal.com`)
- `SUPABASE_SERVICE_ROLE_KEY` (или `SUPABASE_SERVICE_ROLE_KEY_DEV`)
- `NEXT_PUBLIC_SUPABASE_URL` (или `NEXT_PUBLIC_SUPABASE_URL_DEV`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (или `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV`)

### 3. Проверка логов Vercel

**После попытки регистрации:**

1. Откройте Vercel Dashboard
2. Ваш проект → **Functions** → найдите `/api/auth/send-custom-email-confirmation`
3. Откройте логи последнего вызова
4. Найдите строки с префиксом `[send-custom-email-confirmation]`

**Ожидаемые логи (если все правильно):**
```
[send-custom-email-confirmation] Request received: { userId: '...', email: '...' }
[send-custom-email-confirmation] Supabase admin client created
[send-custom-email-confirmation] Token generated
[send-custom-email-confirmation] Token hashed
[send-custom-email-confirmation] Inserting into email_verifications: { email: '...', hasUserId: true }
[send-custom-email-confirmation] Token saved to database
```

**Если есть ошибка, она будет показана с подробностями:**
- `[send-custom-email-confirmation] Error inserting token: ...` - проблема с БД
- `[send-custom-email-confirmation] RESEND_API_KEY is not set` - отсутствует ключ Resend
- `[send-custom-email-confirmation] Failed to create Supabase admin client: ...` - проблема с Supabase

## 🎯 Наиболее вероятные причины ошибки 500

1. **Таблица `email_verifications` не существует** → Создайте таблицу (SQL выше)
2. **Неправильная структура таблицы** (колонка `token` вместо `token_hash`) → Пересоздайте таблицу
3. **Отсутствует `RESEND_API_KEY`** → Установите в Vercel Environment Variables
4. **Отсутствует `SUPABASE_SERVICE_ROLE_KEY`** → Установите в Vercel Environment Variables
5. **Проблема с RLS политиками** → Проверьте, что политика для service_role создана

## 📝 После исправления

1. Попробуйте регистрацию снова
2. Проверьте логи Vercel для подтверждения успеха
3. Проверьте почту - должно прийти письмо с подтверждением


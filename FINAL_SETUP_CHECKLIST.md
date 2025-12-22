# ✅ ФИНАЛЬНЫЙ ЧЕКЛИСТ НАСТРОЙКИ - Подтверждение email через кастомные токены

## 📝 SQL КОД ДЛЯ SUPABASE

**Выполните этот код в Supabase SQL Editor для DEV и PRODUCTION проектов:**

```sql
-- =====================================================
-- SQL КОД ДЛЯ SUPABASE - ПОДТВЕРЖДЕНИЕ EMAIL ЧЕРЕЗ КАСТОМНЫЕ ТОКЕНЫ
-- Выполните этот код в Supabase SQL Editor для DEV и PRODUCTION проектов
-- =====================================================

-- 1. Создание таблицы email_verifications для хранения кастомных токенов
-- ВАЖНО: Токен хранится в виде хеша (SHA256) для безопасности
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Может быть NULL
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE, -- Хеш токена (SHA256), НЕ сам токен!
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  used_at TIMESTAMPTZ, -- Когда токен был использован (NULL = не использован)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_email_verifications_token_hash ON email_verifications(token_hash);
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
```

**Где выполнить:**
- ✅ **DEV проект**: Supabase Dashboard → DEV проект → SQL Editor → New Query → вставить код → Run
- ✅ **PRODUCTION (main) проект**: Supabase Dashboard → PRODUCTION проект → SQL Editor → New Query → вставить код → Run

---

## ✅ ПРОВЕРКА НАСТРОЕК

### 🔵 SUPABASE - Что нужно сделать:

1. ✅ **Выполнить SQL код выше** (для DEV и PRODUCTION)
2. ✅ **Проверить, что триггер синхронизации существует** (должен быть из предыдущих миграций)
   - Триггер `sync_profile_email_verified` автоматически синхронизирует `profiles.email_verified` с `auth.users.email_confirmed_at`
   - Если его нет - не критично, мы обновляем `email_verified` напрямую

**Больше ничего в Supabase делать НЕ нужно:**
- ❌ НЕ нужно менять Redirect URLs (мы не используем стандартные коды Supabase)
- ❌ НЕ нужно менять Site URL
- ❌ НЕ нужно менять настройки Authentication

---

### 🟢 RAILWAY - Что проверить:

**В сервисе `wellify-auth-service` должны быть переменные:**

#### Для DEV окружения:
- ✅ `APP_BASE_URL=https://dev.wellifyglobal.com` (уже есть по скриншоту)
- ✅ `RESEND_API_KEY` (уже есть по скриншоту)
- ✅ `EMAIL_FROM=wellifybusiness@wellifyglobal.com` (уже есть по скриншоту)
- ✅ `SUPABASE_URL` - URL вашего DEV Supabase проекта
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key вашего DEV проекта
- ✅ `NODE_ENV=production` (уже есть)

#### Для PRODUCTION (main) окружения:
- ✅ `APP_BASE_URL=https://business.wellifyglobal.com` (уже есть по скриншоту)
- ✅ `RESEND_API_KEY` (уже есть по скриншоту)
- ✅ `EMAIL_FROM=wellifybusiness@wellifyglobal.com` (уже есть по скриншоту)
- ✅ `SUPABASE_URL` - URL вашего PRODUCTION Supabase проекта
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key вашего PRODUCTION проекта
- ✅ `NODE_ENV=production` (уже есть)

**Больше ничего в Railway делать НЕ нужно** - все переменные уже настроены!

---

### 🟡 VERCEL - Что проверить:

**В основном проекте (wellify-business) должны быть переменные:**

#### Для Production:
- ✅ `NEXT_PUBLIC_SUPABASE_URL_MAIN` или `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY_MAIN` или `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY_MAIN` или `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `NEXT_PUBLIC_APP_URL` (опционально, для формирования ссылок)

#### Для Preview/Development:
- ✅ `NEXT_PUBLIC_SUPABASE_URL_DEV` или `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV` или `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY_DEV` или `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `NEXT_PUBLIC_APP_URL` (опционально)

**Важно:** 
- Vercel используется только для деплоя основного фронтенда
- Эндпоинты `/api/auth/send-custom-email-confirmation` и `/api/auth/confirm-email` работают на Vercel
- Но письма отправляются через Railway (wellify-auth-service), который использует свои переменные

**Больше ничего в Vercel делать НЕ нужно** - если переменные уже настроены для Supabase, все работает!

---

## 📋 ИТОГОВЫЙ ЧЕКЛИСТ

### ✅ Что уже сделано в коде:
1. ✅ Создан `/api/auth/send-custom-email-confirmation` - отправка кастомных писем
2. ✅ Создан `/api/auth/confirm-email` - обработка подтверждения по токену
3. ✅ Изменена регистрация - отключена стандартная отправка Supabase
4. ✅ Проверка email работает через `/api/auth/check-email-confirmed`

### 📝 Что нужно сделать:

1. **Supabase (DEV и PRODUCTION):**
   - ✅ Выполнить SQL код выше (создать таблицу и функцию)

2. **Railway:**
   - ✅ Проверить переменные окружения (уже должны быть настроены)

3. **Vercel:**
   - ✅ Проверить переменные Supabase (уже должны быть настроены)

**ВСЁ! Больше ничего менять не нужно!**

---

## 🧪 Как протестировать

1. Зарегистрируйте нового пользователя
2. Проверьте почту - должно прийти письмо с кнопкой "Подтвердить email"
3. Кликните на кнопку → должна открыться страница "E-mail подтверждён"
4. Кликните еще раз → должна открыться страница "E-mail уже подтверждён"
5. Проверьте в Supabase:
   - `auth.users.email_confirmed_at` должен быть заполнен
   - `profiles.email_verified` должен быть `true`
   - `email_verifications.used_at` должен быть заполнен (после подтверждения)

---

## ⚠️ Важно

- **Стандартные письма Supabase больше НЕ используются** - мы отправляем через Resend
- **emailRedirectTo НЕ передается** в signUp - Supabase не отправляет письма
- **Все письма отправляются через Railway** (`wellify-auth-service`)
- **Токены действительны 24 часа**


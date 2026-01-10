# 🚀 Финальные инструкции по настройке Wellify Business

**Дата:** 10 января 2026  
**Статус:** Последние шаги перед запуском production

---

## ✅ Шаг 1: Создание таблиц в базе данных

### Вариант A: Через Render Dashboard (рекомендуется)

1. **Откройте Render Dashboard:**
   - Перейдите на: https://dashboard.render.com
   - Войдите в свой аккаунт

2. **Откройте PostgreSQL базу данных:**
   - Найдите ваш PostgreSQL сервис: `wellify-business-db` (или аналогичное название)
   - Нажмите на него, чтобы открыть настройки

3. **Откройте вкладку "Connect":**
   - Найдите секцию "Connections" или "Connection Info"
   - Скопируйте Connection String (будет нужен позже)

4. **Откройте вкладку "Query" или "SQL Editor":**
   - Если вкладки нет, используйте "Shell" или подключитесь через внешний клиент

5. **Выполните SQL скрипты по порядку:**

#### Сначала выполните `schema.sql`:

```sql
-- PostgreSQL Schema для Wellify Business
-- Заменяет Supabase структуру

-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Таблица пользователей (заменяет auth.users из Supabase)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  password_hash TEXT, -- bcrypt hash
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_sign_in_at TIMESTAMPTZ,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  raw_app_meta_data JSONB DEFAULT '{}'::jsonb
);

-- Таблица профилей (заменяет public.profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('director', 'manager', 'employee')),
  language TEXT DEFAULT 'uk' CHECK (language IN ('ru', 'uk', 'en', 'ua')),
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Таблица для email верификации
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Таблица для phone верификации (заменяет phone_verification_attempts)
CREATE TABLE IF NOT EXISTS phone_verification_attempts (
  phone TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'signup',
  attempts_count INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  verification_code TEXT,
  code_expires_at TIMESTAMPTZ,
  PRIMARY KEY (phone, action)
);

-- Таблица для password reset
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
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
```

#### Затем выполните `schema-additional.sql` (если нужно):

**ВАЖНО:** В файле `schema.sql` уже включены все таблицы (businesses, staff, locations, shifts, support_sessions, support_messages). 
Файл `schema-additional.sql` может содержать дополнительные поля или обновления. Выполните его только если `schema.sql` не содержит все нужные таблицы.

Проверьте сначала, что выполнение `schema.sql` прошло успешно, затем при необходимости выполните `schema-additional.sql`.

### Вариант B: Через psql CLI

Если у вас есть доступ к psql, выполните:

```bash
# Подключитесь к базе данных (используйте connection string из Render)
psql "postgresql://user:password@host:port/database"

# Затем выполните SQL скрипты
\i backend/src/db/schema.sql
\i backend/src/db/schema-additional.sql
```

### Проверка

После выполнения скриптов проверьте, что таблицы созданы:

```sql
-- Проверьте список таблиц
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Должны быть следующие таблицы:
-- businesses
-- email_verifications
-- locations
-- password_resets
-- phone_verification_attempts
-- profiles
-- shifts
-- staff
-- support_messages
-- support_sessions
-- user_subscriptions
-- users
```

---

## ✅ Шаг 2: Настройка Environment Variables в Cloudflare Pages

### Вариант A: Через Cloudflare Dashboard (рекомендуется)

1. **Откройте Cloudflare Dashboard:**
   - Перейдите на: https://dash.cloudflare.com
   - Войдите в свой аккаунт

2. **Откройте Pages проект:**
   - В левом меню выберите **Workers & Pages**
   - Найдите проект **wellify-business**
   - Нажмите на него

3. **Откройте настройки Environment Variables:**
   - Перейдите на вкладку **Settings**
   - В левом меню найдите **Environment variables**
   - Нажмите на него

4. **Добавьте переменные для Production:**
   - Выберите секцию **Production**
   - Нажмите **Add variable**

   **Добавьте следующие переменные:**

   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://wellify-business-backend.onrender.com
   ```

   ```
   Name: NEXT_PUBLIC_APP_URL
   Value: https://3ed16b3d.wellify-business.pages.dev
   ```

   **Опционально (если используются):**
   ```
   Name: NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
   Value: ваш_telegram_bot_username
   ```

   ```
   Name: NEXT_PUBLIC_TELEGRAM_API_URL
   Value: ваш_telegram_api_url
   ```

   ```
   Name: NEXT_PUBLIC_SITE_URL
   Value: https://3ed16b3d.wellify-business.pages.dev
   ```

5. **Сохраните изменения:**
   - Нажмите **Save** для каждой переменной
   - После сохранения всех переменных, Cloudflare автоматически запустит новый деплой

### Вариант B: Через Wrangler CLI

```bash
# Установите wrangler (если еще не установлен)
npm install -g wrangler

# Войдите в Cloudflare (если еще не вошли)
npx wrangler login

# Добавьте environment variables для production
npx wrangler pages secret put NEXT_PUBLIC_API_URL --project-name=wellify-business
# Введите значение: https://wellify-business-backend.onrender.com

npx wrangler pages secret put NEXT_PUBLIC_APP_URL --project-name=wellify-business
# Введите значение: https://3ed16b3d.wellify-business.pages.dev

# Для обычных переменных (не секретов) используйте:
# npx wrangler pages project update wellify-business
# Или добавьте через Dashboard (см. Вариант A)
```

**Примечание:** `wrangler pages secret` предназначен для секретов. Для публичных переменных (`NEXT_PUBLIC_*`) используйте Dashboard или добавьте их в `wrangler.toml`:

```toml
# wrangler.toml
[env.production.vars]
NEXT_PUBLIC_API_URL = "https://wellify-business-backend.onrender.com"
NEXT_PUBLIC_APP_URL = "https://3ed16b3d.wellify-business.pages.dev"
```

### Проверка

После добавления переменных:
1. Дождитесь завершения нового деплоя (автоматически запустится)
2. Проверьте логи деплоя на вкладке **Deployments**
3. Убедитесь, что деплой прошел успешно

---

## ✅ Шаг 3: Обновление Stripe Webhook URL

### Вариант A: Через Stripe Dashboard (рекомендуется)

1. **Откройте Stripe Dashboard:**
   - Перейдите на: https://dashboard.stripe.com
   - Войдите в свой аккаунт

2. **Откройте Webhooks:**
   - В левом меню найдите **Developers** → **Webhooks**
   - Найдите ваш webhook: **playful-radiance** (или другое название)
   - Нажмите на него

3. **Обновите Endpoint URL:**
   - Нажмите **Edit** или **Update endpoint**
   - Измените **Endpoint URL** на:
     ```
     https://wellify-business-backend.onrender.com/api/stripe/webhook-handler
     ```
   - Убедитесь, что выбранные **Events to send** включают:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Нажмите **Save changes**

4. **Получите Webhook Signing Secret:**
   - После сохранения, нажмите **Reveal** рядом с **Signing secret**
   - Скопируйте секрет (начинается с `whsec_...`)
   - Этот секрет нужно добавить в Environment Variables на Render

### Вариант B: Через Stripe CLI

```bash
# Установите Stripe CLI (если еще не установлен)
# macOS: brew install stripe/stripe-cli/stripe
# Linux: см. https://stripe.com/docs/stripe-cli

# Войдите в Stripe (если еще не вошли)
stripe login

# Обновите webhook
stripe webhooks update wh_xxxxx \
  --url https://wellify-business-backend.onrender.com/api/stripe/webhook-handler \
  --enabled-events customer.subscription.created \
  --enabled-events customer.subscription.updated \
  --enabled-events customer.subscription.deleted \
  --enabled-events checkout.session.completed \
  --enabled-events invoice.payment_succeeded \
  --enabled-events invoice.payment_failed
```

### Добавление Stripe Webhook Secret в Render

1. **Откройте Render Dashboard:**
   - Перейдите на: https://dashboard.render.com
   - Найдите ваш backend сервис: **wellify-business-backend**

2. **Откройте Environment Variables:**
   - Нажмите на сервис
   - Перейдите на вкладку **Environment**
   - Прокрутите до секции **Environment Variables**

3. **Добавьте Stripe Webhook Secret:**
   - Нажмите **Add Environment Variable**
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (скопированный из Stripe Dashboard)
   - Нажмите **Save Changes**

4. **Перезапустите сервис:**
   - После добавления переменной, Render автоматически перезапустит сервис
   - Или нажмите **Manual Deploy** → **Deploy latest commit**

---

## ✅ Шаг 4: Финальная проверка и тестирование

### 1. Проверка Backend

Откройте в браузере:

```
https://wellify-business-backend.onrender.com/api/health/live
```

Должен вернуться JSON:
```json
{
  "status": "ok",
  "timestamp": "2026-01-10T...",
  "uptime": 123.456
}
```

```
https://wellify-business-backend.onrender.com/api/health/ready
```

Должен вернуться JSON:
```json
{
  "ready": true,
  "database": "connected",
  "timestamp": "2026-01-10T..."
}
```

### 2. Тестирование Frontend

Откройте в браузере:

```
https://3ed16b3d.wellify-business.pages.dev
```

#### Тест 1: Регистрация нового пользователя (директора)

1. Перейдите на страницу регистрации
2. Заполните форму:
   - Имя, Фамилия
   - Email
   - Пароль
   - Дата рождения
3. Нажмите "Зарегистрироваться"
4. Проверьте email для подтверждения (если настроена отправка email)
5. После подтверждения email, завершите регистрацию

**Ожидаемый результат:**
- Пользователь успешно создан
- Профиль создан
- Бизнес создан (для директора)
- Редирект на dashboard директора

#### Тест 2: Вход в систему

1. Перейдите на страницу входа
2. Введите email и пароль зарегистрированного пользователя
3. Нажмите "Войти"

**Ожидаемый результат:**
- Успешный вход
- Редирект на dashboard в зависимости от роли пользователя

#### Тест 3: Создание бизнеса

1. Войдите в систему как директор
2. Перейдите в настройки или раздел бизнеса
3. Создайте новый бизнес:
   - Название
   - Код компании
   - Тип бизнеса
   - Адрес и контакты

**Ожидаемый результат:**
- Бизнес успешно создан
- Бизнес отображается в списке
- Сотрудник (staff) связан с бизнесом

#### Тест 4: Управление профилем

1. Войдите в систему
2. Перейдите в настройки профиля
3. Обновите информацию:
   - Имя
   - Телефон
   - Язык интерфейса

**Ожидаемый результат:**
- Профиль успешно обновлен
- Изменения сохраняются в базе данных
- Изменения отображаются в интерфейсе

#### Тест 5: Верификация телефона

1. Перейдите в настройки профиля
2. Добавьте номер телефона
3. Запросите код верификации
4. Введите полученный код

**Ожидаемый результат:**
- Код отправлен (если настроена SMS интеграция)
- Код можно ввести вручную для тестирования
- После верификации, телефон отмечен как подтвержденный

---

## 🔧 Troubleshooting

### Проблема 1: Backend не отвечает

**Решение:**
- Проверьте, что сервис запущен на Render
- Проверьте логи на Render Dashboard
- Убедитесь, что все Environment Variables настроены
- Проверьте подключение к базе данных

### Проблема 2: Frontend не может подключиться к Backend

**Решение:**
- Проверьте `NEXT_PUBLIC_API_URL` в Cloudflare Pages
- Убедитесь, что URL правильный и доступен
- Проверьте CORS настройки на backend
- Проверьте логи в браузере (F12 → Console)

### Проблема 3: Таблицы не создаются

**Решение:**
- Убедитесь, что вы выполнили SQL скрипты в правильном порядке
- Проверьте права доступа к базе данных
- Проверьте логи в Render Dashboard
- Попробуйте создать таблицы вручную

### Проблема 4: Stripe Webhook не работает

**Решение:**
- Проверьте `STRIPE_WEBHOOK_SECRET` в Render Environment Variables
- Убедитесь, что URL webhook правильный
- Проверьте логи на Render для ошибок
- Проверьте Stripe Dashboard → Webhooks → Logs

### Проблема 5: Environment Variables не применяются

**Решение:**
- После добавления переменных, Cloudflare должен автоматически перезадеплоить
- Если нет, запустите деплой вручную
- Убедитесь, что переменные добавлены для правильной среды (Production)
- Проверьте синтаксис имен переменных (`NEXT_PUBLIC_*`)

---

## 📋 Чеклист финальной настройки

- [ ] SQL скрипты выполнены (`schema.sql` и `schema-additional.sql`)
- [ ] Таблицы созданы в базе данных (проверка через SQL запрос)
- [ ] `NEXT_PUBLIC_API_URL` добавлена в Cloudflare Pages
- [ ] `NEXT_PUBLIC_APP_URL` добавлена в Cloudflare Pages
- [ ] Stripe Webhook URL обновлен
- [ ] `STRIPE_WEBHOOK_SECRET` добавлен в Render Environment Variables
- [ ] Backend health checks работают (`/api/health/live` и `/api/health/ready`)
- [ ] Frontend доступен по URL
- [ ] Регистрация работает
- [ ] Вход работает
- [ ] Создание бизнеса работает
- [ ] Обновление профиля работает

---

## 🎉 Готово!

После выполнения всех шагов ваше приложение должно полностью работать в production!

**Production URLs:**
- **Frontend:** https://3ed16b3d.wellify-business.pages.dev
- **Backend:** https://wellify-business-backend.onrender.com
- **Backend Health:** https://wellify-business-backend.onrender.com/api/health/live

**Документация:**
- Полный отчет о миграции: `MIGRATION_REPORT.md`
- Данная инструкция: `FINAL_SETUP_INSTRUCTIONS.md`

---

**Дата создания:** 10 января 2026  
**Последнее обновление:** 10 января 2026

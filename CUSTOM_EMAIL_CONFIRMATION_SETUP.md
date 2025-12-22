# Новая тактика подтверждения email через кастомные токены

## Что изменилось

Полностью переработана система подтверждения email:
- ❌ **Старая тактика**: Использование стандартных кодов Supabase (`exchangeCodeForSession`)
- ✅ **Новая тактика**: Кастомные токены, хранящиеся в БД, полный контроль над процессом

## Как это работает

### 1. Регистрация пользователя
- Пользователь регистрируется через `supabase.auth.signUp()` **БЕЗ** `emailRedirectTo`
- Создается пользователь в Supabase, но email НЕ подтверждается автоматически

### 2. Генерация кастомного токена
- После успешной регистрации вызывается `/api/auth/send-custom-email-confirmation`
- Генерируется уникальный токен (32 байта, hex)
- Токен сохраняется в таблице `email_verifications` с:
  - `user_id` - ID пользователя
  - `email` - email адрес
  - `token` - уникальный токен
  - `expires_at` - срок действия (24 часа)
  - `verified_at` - NULL (будет заполнен при подтверждении)

### 3. Отправка письма
- Письмо отправляется через **Resend API** (не через Supabase)
- В письме ссылка: `{RAILWAY_URL}/api/auth/confirm-email?token={TOKEN}`
- Полный контроль над содержимым письма

### 4. Подтверждение email
- Пользователь кликает на ссылку → переход на `/api/auth/confirm-email?token=...`
- Railway эндпоинт:
  1. Ищет токен в таблице `email_verifications`
  2. Проверяет срок действия
  3. Проверяет, использован ли уже (`verified_at` не NULL = повторный клик)
  4. Если первый раз:
     - Вызывает SQL функцию `confirm_user_email(user_id)` для установки `email_confirmed_at`
     - Обновляет `profiles.email_verified = true`
     - Помечает токен как использованный (`verified_at = NOW()`)
  5. Редиректит на фронтенд с соответствующим статусом

## Что нужно сделать

### 1. Выполнить SQL миграции в Supabase

#### Для DEV проекта:
```sql
-- Выполнить в Supabase SQL Editor
-- 1. Создать таблицу email_verifications
-- Файл: supabase/migrations/013_create_email_verifications.sql

-- 2. Создать функцию confirm_user_email
-- Файл: supabase/migrations/014_create_confirm_email_function.sql
```

#### Для PRODUCTION (main) проекта:
```sql
-- То же самое, но в PRODUCTION Supabase проекте
```

### 2. Настроить переменные окружения в Railway

Убедитесь, что в `wellify-auth-service` установлены:
- `RESEND_API_KEY` - ключ Resend API
- `EMAIL_FROM` - адрес отправителя (например, `wellifybusiness@wellifyglobal.com`)
- `APP_BASE_URL` - URL Railway сервиса (для dev и production разные)
- `SUPABASE_URL` - URL Supabase проекта
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key

### 3. Проверить работу

1. Зарегистрируйте нового пользователя
2. Проверьте почту - должно прийти письмо с кнопкой "Подтвердить email"
3. Кликните на кнопку → должна открыться страница "E-mail подтверждён"
4. Кликните еще раз → должна открыться страница "E-mail уже подтверждён"

## Преимущества новой тактики

1. ✅ **Полный контроль** - мы сами генерируем токены и управляем процессом
2. ✅ **Надежность** - не зависим от стандартного flow Supabase
3. ✅ **Гибкость** - можем настроить срок действия, логирование, аналитику
4. ✅ **Отслеживание** - видим в БД, кто и когда подтвердил email
5. ✅ **Кастомные письма** - полный контроль над дизайном и содержимым

## Структура таблицы email_verifications

```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,  -- NULL = не использован, заполнен = использован
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);
```

## Определение первого/повторного клика

- **Первый клик**: `verified_at IS NULL` → обновляем БД, устанавливаем `verified_at = NOW()`
- **Повторный клик**: `verified_at IS NOT NULL` → показываем "уже подтверждён"

## Важно

- Токены действительны 24 часа
- Каждый токен можно использовать только один раз
- После использования токен помечается как использованный (`verified_at`)
- Стандартные коды Supabase больше не используются для подтверждения email


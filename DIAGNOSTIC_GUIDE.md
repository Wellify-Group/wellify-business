# Диагностика проблем с синхронизацией профилей

## Проблема

После регистрации и подтверждения email:
- ❌ Поля `first_name`, `last_name`, `middle_name`, `birth_date` остаются NULL в `profiles`
- ❌ `email_verified` не обновляется на `true` после подтверждения email

## Шаги диагностики

### 1. Проверьте, применена ли миграция

Выполните в Supabase SQL Editor:

```sql
-- Проверяем наличие полей
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('first_name', 'last_name', 'middle_name', 'birth_date', 'email_verified');

-- Проверяем наличие функций
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('handle_new_user', 'sync_email_verified');

-- Проверяем наличие триггеров
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name IN ('on_auth_user_created', 'on_auth_user_email_confirmed');
```

**Если чего-то не хватает** → Примените миграцию `005_fix_profile_sync_diagnostic.sql`

### 2. Проверьте, где хранятся метаданные

После регистрации нового пользователя выполните:

```sql
-- Проверяем метаданные пользователя
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  user_metadata
FROM auth.users
WHERE email = 'ваш_email@example.com';
```

**Важно:** В Supabase метаданные из `options.data` в `signUp` могут попадать в:
- `raw_user_meta_data` (чаще всего)
- `raw_app_meta_data` (реже)
- `user_metadata` (устаревшее поле, не используется в триггерах)

### 3. Проверьте работу триггера при создании пользователя

Создайте тестового пользователя и проверьте:

```sql
-- Создайте тестового пользователя через Supabase Dashboard → Authentication → Users → Add User
-- Или через API с метаданными

-- Затем проверьте профиль
SELECT * FROM profiles WHERE id = 'user_id_из_шага_выше';
```

**Если профиль не создался или поля пустые:**
- Проверьте логи Supabase (Dashboard → Logs → Postgres Logs)
- Убедитесь, что триггер `on_auth_user_created` существует и активен

### 4. Проверьте работу триггера при подтверждении email

```sql
-- Проверьте, обновляется ли email_verified
SELECT 
  p.id,
  p.email_verified,
  u.email_confirmed_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'ваш_email@example.com';
```

**Если `email_verified = false`, но `email_confirmed_at IS NOT NULL`:**
- Триггер `on_auth_user_email_confirmed` не сработал
- Примените миграцию `005_fix_profile_sync_diagnostic.sql`

### 5. Проверьте права доступа

Триггеры используют `SECURITY DEFINER`, но убедитесь, что функция имеет доступ:

```sql
-- Проверяем владельца функции
SELECT 
  routine_name,
  routine_schema,
  security_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```

Должно быть: `security_type = 'DEFINER'`

## Решение

### Вариант 1: Применить исправленную миграцию

Выполните файл `supabase/migrations/005_fix_profile_sync_diagnostic.sql` в Supabase SQL Editor.

Эта миграция:
- ✅ Добавляет все необходимые поля
- ✅ Обновляет функцию `handle_new_user()` с проверкой обоих источников метаданных
- ✅ Обновляет функцию `sync_email_verified()`
- ✅ Синхронизирует существующие записи

### Вариант 2: Ручная синхронизация существующих пользователей

Если миграция применена, но старые пользователи не синхронизированы:

```sql
-- Синхронизируем метаданные для существующих пользователей
UPDATE public.profiles p
SET
  first_name = COALESCE(
    p.first_name,
    (SELECT raw_user_meta_data->>'first_name' FROM auth.users WHERE id = p.id),
    NULL
  ),
  last_name = COALESCE(
    p.last_name,
    (SELECT raw_user_meta_data->>'last_name' FROM auth.users WHERE id = p.id),
    NULL
  ),
  middle_name = COALESCE(
    p.middle_name,
    (SELECT raw_user_meta_data->>'middle_name' FROM auth.users WHERE id = p.id),
    NULL
  ),
  birth_date = COALESCE(
    p.birth_date,
    CASE 
      WHEN (SELECT raw_user_meta_data->>'birth_date' FROM auth.users WHERE id = p.id) IS NOT NULL
      THEN (SELECT (raw_user_meta_data->>'birth_date')::date FROM auth.users WHERE id = p.id)
      ELSE NULL
    END,
    NULL
  ),
  email_verified = CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = p.id AND email_confirmed_at IS NOT NULL)
    THEN true
    ELSE COALESCE(p.email_verified, false)
  END
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = p.id);
```

## Проверка после исправления

1. **Зарегистрируйте нового пользователя** через форму регистрации
2. **Проверьте профиль сразу после signUp:**
   ```sql
   SELECT * FROM profiles WHERE email = 'новый_email@example.com';
   ```
   Должны быть заполнены: `first_name`, `last_name`, `middle_name`, `birth_date`, `full_name`
   `email_verified` должен быть `false`

3. **Подтвердите email** по ссылке из письма
4. **Проверьте профиль после подтверждения:**
   ```sql
   SELECT 
     p.*,
     u.email_confirmed_at
   FROM profiles p
   JOIN auth.users u ON p.id = u.id
   WHERE u.email = 'новый_email@example.com';
   ```
   `email_verified` должен стать `true`

## Частые проблемы

### Проблема: Метаданные не попадают в триггер

**Причина:** В Supabase метаданные из `options.data` могут попадать в `raw_app_meta_data` вместо `raw_user_meta_data`

**Решение:** Исправленная миграция проверяет оба источника

### Проблема: Триггер не срабатывает

**Причина:** 
- Триггер не создан
- Триггер отключен
- Ошибка в функции триггера

**Решение:** 
- Проверьте наличие триггера (см. шаг 1)
- Проверьте логи Supabase на наличие ошибок
- Пересоздайте триггер через миграцию

### Проблема: RLS блокирует обновление

**Причина:** Row Level Security может блокировать обновление профиля

**Решение:** Функции используют `SECURITY DEFINER`, что должно обходить RLS. Проверьте политики:

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

Должна быть политика для `service_role`:
```sql
CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

## Контакты для поддержки

Если проблема не решается:
1. Проверьте логи Supabase (Dashboard → Logs)
2. Проверьте консоль браузера на наличие ошибок
3. Проверьте Network tab в DevTools при регистрации


# Быстрое исправление синхронизации профилей

## Проблема
После регистрации и подтверждения email поля в `profiles` остаются NULL.

## Решение (5 минут)

### Шаг 1: Откройте Supabase SQL Editor
1. Перейдите в **Supabase Dashboard**
2. Откройте **SQL Editor** → **New Query**

### Шаг 2: Скопируйте и выполните миграцию
Скопируйте **весь** файл `supabase/migrations/005_fix_profile_sync_diagnostic.sql` и выполните в SQL Editor.

### Шаг 3: Проверьте результат
Выполните этот запрос, чтобы убедиться, что все создано:

```sql
-- Проверка полей
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('first_name', 'last_name', 'middle_name', 'birth_date', 'email_verified');

-- Должно вернуть 5 строк

-- Проверка функций
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('handle_new_user', 'sync_email_verified');

-- Должно вернуть 2 строки

-- Проверка триггеров
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name IN ('on_auth_user_created', 'on_auth_user_email_confirmed');

-- Должно вернуть 2 строки
```

### Шаг 4: Протестируйте
1. Зарегистрируйте нового пользователя через форму `/register`
2. Сразу после регистрации проверьте в Supabase:
   ```sql
   SELECT * FROM profiles WHERE email = 'ваш_email@example.com';
   ```
   Должны быть заполнены: `first_name`, `last_name`, `middle_name`, `birth_date`, `full_name`
3. Подтвердите email по ссылке
4. Проверьте снова:
   ```sql
   SELECT email_verified, first_name, last_name FROM profiles WHERE email = 'ваш_email@example.com';
   ```
   `email_verified` должен быть `true`

## Если не работает

### Вариант A: Метаданные не попадают в триггер
Проверьте, где хранятся метаданные:

```sql
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users
WHERE email = 'ваш_email@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

Если метаданные в `raw_app_meta_data`, миграция уже это учитывает. Если их нет вообще - проблема в передаче метаданных при `signUp`.

### Вариант B: Триггер не срабатывает
Проверьте логи Supabase:
1. Dashboard → **Logs** → **Postgres Logs**
2. Ищите ошибки с `handle_new_user` или `sync_email_verified`

### Вариант C: Синхронизируйте существующих пользователей вручную
Если миграция применена, но старые пользователи не синхронизированы:

```sql
-- Обновляем email_verified для всех подтвержденных пользователей
UPDATE profiles p
SET email_verified = true
FROM auth.users u
WHERE p.id = u.id
  AND u.email_confirmed_at IS NOT NULL
  AND (p.email_verified IS NULL OR p.email_verified = false);

-- Синхронизируем метаданные
UPDATE profiles p
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
  )
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = p.id);
```

## Что делает миграция

1. ✅ Добавляет все необходимые поля в `profiles`
2. ✅ Обновляет `handle_new_user()` для чтения метаданных из обоих источников
3. ✅ Обновляет `sync_email_verified()` для автоматического обновления статуса
4. ✅ Создает/обновляет триггеры
5. ✅ Синхронизирует существующие записи

## После исправления

Все новые пользователи будут автоматически получать:
- ✅ Заполненные `first_name`, `last_name`, `middle_name`, `birth_date`, `full_name` при регистрации
- ✅ `email_verified = true` после подтверждения email


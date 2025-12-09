# Инструкции по применению миграции для синхронизации профилей

## Описание изменений

Эта миграция добавляет поддержку полей `first_name`, `last_name`, `middle_name`, `birth_date` в таблицу `profiles` и настраивает автоматическую синхронизацию данных между `auth.users` и `profiles`.

## Что делает миграция

1. **Добавляет поля в таблицу `profiles`**:
   - `first_name` (TEXT)
   - `last_name` (TEXT)
   - `middle_name` (TEXT)
   - `birth_date` (DATE)

2. **Обновляет функцию `handle_new_user()`**:
   - Заполняет все поля из метаданных пользователя (`raw_user_meta_data`)
   - Автоматически формирует `full_name` из `last_name`, `first_name`, `middle_name`
   - Устанавливает `email_verified = false` при создании

3. **Создаёт функцию `sync_email_verified()`**:
   - Автоматически обновляет `email_verified = true` в `profiles` при подтверждении email в `auth.users`

4. **Создаёт триггер `on_auth_user_email_confirmed`**:
   - Отслеживает изменения `email_confirmed_at` в `auth.users`
   - Автоматически синхронизирует `email_verified` в `profiles`

## Как применить миграцию

1. Откройте Supabase Dashboard → SQL Editor
2. Скопируйте содержимое файла `supabase/migrations/004_add_profile_fields_and_sync.sql`
3. Вставьте в SQL Editor и выполните запрос

## Проверка после применения

После применения миграции проверьте:

1. **Поля добавлены в таблицу `profiles`**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name IN ('first_name', 'last_name', 'middle_name', 'birth_date');
   ```

2. **Функции созданы**:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN ('handle_new_user', 'sync_email_verified');
   ```

3. **Триггеры созданы**:
   ```sql
   SELECT trigger_name, event_object_table 
   FROM information_schema.triggers 
   WHERE trigger_name IN ('on_auth_user_created', 'on_auth_user_email_confirmed');
   ```

## Тестирование

1. Зарегистрируйте нового пользователя через форму регистрации
2. Проверьте, что в таблице `profiles` создалась запись с заполненными полями:
   - `first_name`, `last_name`, `middle_name`, `birth_date`, `full_name`
   - `email_verified = false`
3. Подтвердите email по ссылке из письма
4. Проверьте, что `email_verified` стало `true` в таблице `profiles`

## Откат миграции (если нужно)

Если нужно откатить изменения:

```sql
-- Удаляем триггеры
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Удаляем функции
DROP FUNCTION IF EXISTS public.sync_email_verified();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Удаляем поля (опционально, если они не используются)
ALTER TABLE profiles DROP COLUMN IF EXISTS first_name;
ALTER TABLE profiles DROP COLUMN IF EXISTS last_name;
ALTER TABLE profiles DROP COLUMN IF EXISTS middle_name;
ALTER TABLE profiles DROP COLUMN IF EXISTS birth_date;
```

## Важные замечания

- Миграция использует `SECURITY DEFINER`, что позволяет функциям выполнять операции от имени создателя функции
- RLS-политики на таблице `profiles` остаются без изменений
- Существующие записи в `profiles` не будут автоматически обновлены - только новые пользователи будут создаваться с заполненными полями


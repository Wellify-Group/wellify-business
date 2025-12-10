# Исправление флоу регистрации - Резюме

## ✅ Что уже исправлено

### 1. Фронтенд (app/register/RegisterDirectorClient.tsx)

**Файл:** `app/register/RegisterDirectorClient.tsx`  
**Строки:** 327-339

Код уже правильно передает метаданные:

```typescript
const { error } = await supabase.auth.signUp({
  email: form.email.trim(),
  password: baseData.password,
  options: {
    data: {
      first_name: baseData.firstName,
      last_name: baseData.lastName,
      middle_name: baseData.middleName,
      birth_date: baseData.birthDate,  // ✅ Уже передается
    },
    emailRedirectTo: redirectTo,  // ✅ Уже настроен на /auth/email-confirmed
  },
});
```

**Статус:** ✅ Уже исправлено

### 2. Redirect URL

**Файл:** `app/register/RegisterDirectorClient.tsx`  
**Строки:** 323-325

```typescript
const redirectTo = `${
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dev.wellifyglobal.com"
}/auth/email-confirmed`;
```

**Статус:** ✅ Уже настроено правильно

## 🔧 Что нужно сделать

### SQL-миграция для Supabase

**Файл:** `supabase/migrations/006_fix_handle_new_user_final.sql`

**Инструкция:**
1. Откройте **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Скопируйте **весь** файл `supabase/migrations/006_fix_handle_new_user_final.sql`
3. Вставьте в SQL Editor и выполните

**Что делает миграция:**
- ✅ Добавляет все необходимые поля в `profiles` (если их нет)
- ✅ Обновляет функцию `handle_new_user()` для чтения метаданных из `raw_user_meta_data`
- ✅ Заполняет `first_name`, `last_name`, `middle_name`, `birth_date`, `full_name` при создании пользователя
- ✅ Устанавливает `email_verified = false` при создании
- ✅ Создает триггер `on_auth_user_created` для автоматического вызова функции
- ✅ Обновляет функцию `sync_email_verified()` для автоматического обновления статуса
- ✅ Синхронизирует существующие записи

## 📋 Проверка после применения

### 1. Проверьте, что миграция применена

Выполните в Supabase SQL Editor:

```sql
-- Проверка полей
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('first_name', 'last_name', 'middle_name', 'birth_date', 'email_verified');
-- Должно вернуть 5 строк

-- Проверка функции
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_user';
-- Должно вернуть 1 строку

-- Проверка триггера
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
-- Должно вернуть 1 строку
```

### 2. Протестируйте регистрацию

1. Зарегистрируйте нового пользователя через форму `/register`
2. Сразу после `signUp` проверьте в Supabase:

```sql
SELECT 
  id,
  email,
  first_name,
  last_name,
  middle_name,
  birth_date,
  full_name,
  email_verified
FROM profiles 
WHERE email = 'ваш_email@example.com';
```

**Ожидаемый результат:**
- ✅ `first_name`, `last_name`, `middle_name`, `birth_date`, `full_name` должны быть заполнены
- ✅ `email_verified` должен быть `false`

3. Подтвердите email по ссылке из письма
4. Проверьте снова:

```sql
SELECT email_verified, first_name, last_name 
FROM profiles 
WHERE email = 'ваш_email@example.com';
```

**Ожидаемый результат:**
- ✅ `email_verified` должен стать `true`

## 🔍 Отладка

Если поля все еще NULL:

1. **Проверьте метаданные в auth.users:**
   ```sql
   SELECT 
     id,
     email,
     raw_user_meta_data
   FROM auth.users
   WHERE email = 'ваш_email@example.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   
   Должны быть поля: `first_name`, `last_name`, `middle_name`, `birth_date`

2. **Проверьте логи Supabase:**
   - Dashboard → **Logs** → **Postgres Logs**
   - Ищите ошибки с `handle_new_user`

3. **Проверьте, что триггер активен:**
   ```sql
   SELECT 
     trigger_name,
     event_manipulation,
     event_object_table,
     action_statement
   FROM information_schema.triggers
   WHERE trigger_name = 'on_auth_user_created';
   ```

## 📝 Примечания

- Функция поддерживает оба варианта даты: `birth_date` и `dob` (для обратной совместимости)
- В БД используется колонка `birth_date` (тип `DATE`)
- Метаданные передаются через `options.data` в `signUp`, что сохраняет их в `raw_user_meta_data`
- Функция использует `SECURITY DEFINER`, что позволяет обходить RLS при создании профиля


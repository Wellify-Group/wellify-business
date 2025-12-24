# 🗄️ Руководство по применению миграций Supabase

> **КРИТИЧЕСКИ ВАЖНО:** Применяйте миграции в PRODUCTION после каждого деплоя в main!

## ⚠️ Проблема: "Could not find the table 'public.email_verifications'"

Эта ошибка возникает, когда миграции были применены в **DEV**, но не были применены в **PRODUCTION**.

---

## 📋 Быстрое решение

### Шаг 1: Откройте Supabase Dashboard

1. Зайдите на [supabase.com](https://supabase.com)
2. Выберите ваш **PRODUCTION** проект (не dev!)
3. Перейдите в **SQL Editor**

### Шаг 2: Примените миграцию

Скопируйте и выполните следующий SQL:

```sql
-- Migration: Create email_verifications table
-- КРИТИЧЕСКИ ВАЖНО: Применяйте в PRODUCTION после деплоя!

-- Удаляем старую таблицу если она существует с неправильной структурой
DROP TABLE IF EXISTS public.email_verifications CASCADE;

-- Создаем таблицу с правильной структурой
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_email_verifications_token 
  ON public.email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id 
  ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email 
  ON public.email_verifications(email);

-- Включаем RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
```

### Шаг 3: Проверьте создание таблицы

Выполните проверочный запрос:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'email_verifications';
```

Должна вернуться одна строка с `email_verifications`.

---

## 🔄 Процесс применения миграций

### После каждого деплоя в main:

1. **Проверьте новые миграции:**
   ```bash
   # В репозитории проверьте папку supabase/migrations/
   ls supabase/migrations/
   ```

2. **Откройте Supabase Dashboard → PRODUCTION проект**

3. **SQL Editor → New Query**

4. **Скопируйте содержимое новой миграции** (например, `014_fix_email_verifications_table.sql`)

5. **Выполните SQL**

6. **Проверьте результат:**
   - Должно быть сообщение "Success. No rows returned"
   - Или количество затронутых строк

---

## 📁 Структура миграций

Все миграции находятся в `supabase/migrations/`:

```
supabase/migrations/
├── 001_support_telegram_integration.sql
├── 002_add_verification_fields.sql
├── 003_create_profiles_with_roles.sql
├── ...
├── 013_create_email_verifications.sql      ← Создает таблицу
└── 014_fix_email_verifications_table.sql   ← Исправляет структуру
```

**⚠️ ВАЖНО:** Применяйте миграции в порядке номеров!

---

## ✅ Чеклист после деплоя в main

- [ ] Проверены новые миграции в `supabase/migrations/`
- [ ] Открыт **PRODUCTION** проект в Supabase (не dev!)
- [ ] Применены все новые миграции через SQL Editor
- [ ] Проверено создание таблиц:
  ```sql
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('email_verifications', 'profiles', ...);
  ```
- [ ] Протестирована функциональность (регистрация, отправка кода)

---

## 🚨 Частые ошибки

### Ошибка 1: "relation does not exist"

**Причина:** Таблица не создана в production

**Решение:** Примените миграцию создания таблицы

### Ошибка 2: "duplicate key value violates unique constraint"

**Причина:** Попытка создать индекс/ограничение, которое уже существует

**Решение:** Используйте `CREATE INDEX IF NOT EXISTS` и `CREATE UNIQUE INDEX IF NOT EXISTS`

### Ошибка 3: "permission denied"

**Причина:** Недостаточно прав для создания таблицы

**Решение:** Убедитесь, что используете правильный проект и есть права администратора

---

## 📝 Рекомендации

1. **Всегда применяйте миграции в PRODUCTION после деплоя**
2. **Проверяйте результат выполнения SQL**
3. **Делайте бэкап перед применением миграций** (опционально, но рекомендуется)
4. **Тестируйте функциональность после применения миграций**

---

## 🔗 Связанные файлы

- `supabase/migrations/013_create_email_verifications.sql` - создание таблицы
- `supabase/migrations/014_fix_email_verifications_table.sql` - исправление структуры
- `app/api/auth/send-verification-code/route.ts` - API, использующий таблицу

---

**Последнее обновление:** Декабрь 2024


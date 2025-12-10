# Реализация поддержки сохранения языка интерфейса пользователя

## ✅ Выполненные изменения

### 1. База данных

**Файл:** `supabase/migrations/008_add_locale_to_profiles.sql`

- ✅ Добавлена колонка `locale TEXT DEFAULT 'ru' NOT NULL` в таблицу `profiles`
- ✅ Обновлена функция `handle_new_user()` для синхронизации `locale` из `raw_user_meta_data`
- ✅ Создана функция `sync_user_locale()` для обновления locale при изменении метаданных
- ✅ Создан триггер `on_auth_user_metadata_updated` для автоматической синхронизации
- ✅ Выполнена миграция существующих пользователей (обновление locale из метаданных)

**RLS-политики:** Не изменены, так как `locale` - это обычная колонка, доступная через существующие политики.

### 2. Фронтенд - передача locale в signUp

**Файл:** `app/register/RegisterDirectorClient.tsx` (строка 361)

**Изменение:**
```typescript
const { language } = useLanguage(); // 'en' | 'ua' | 'ru'
const localeForAPI = language === "ua" ? "uk" : language; // Маппинг 'ua' -> 'uk'

await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      // ... другие поля
      locale: localeForAPI, // Сохраняем язык интерфейса: 'ru' | 'uk' | 'en'
    },
    emailRedirectTo: redirectTo,
  },
});
```

### 3. SQL-триггер для синхронизации

**Вариант:** SQL-триггер (используется этот подход)

**Файл:** `supabase/migrations/008_add_locale_to_profiles.sql`

- ✅ Триггер `on_auth_user_created` автоматически копирует `locale` из `raw_user_meta_data` в `profiles.locale` при создании пользователя
- ✅ Триггер `on_auth_user_metadata_updated` синхронизирует `locale` при обновлении метаданных
- ✅ Маппинг `'ua' -> 'uk'` выполняется автоматически в SQL функции

**Комментарий в коде:** Указан используемый подход (SQL-триггер) в комментариях к функции.

### 4. Утилиты

#### 4.1. `getUserLocale`

**Файл:** `lib/users/getUserLocale.ts`

```typescript
export async function getUserLocale(userId: string): Promise<Locale>
```

- ✅ Читает `profiles.locale` по `userId`
- ✅ Возвращает `'ru' | 'uk' | 'en'`, по умолчанию `'ru'`
- ✅ Валидация и нормализация locale
- ✅ Fallback функция `getUserLocaleFromMetadata()` для получения из метаданных

#### 4.2. `getTemplateId`

**Файл:** `lib/users/emailTemplates.ts`

```typescript
export function getTemplateId(type: EmailTemplateType, locale: Locale): string
```

- ✅ Функция для получения template_id в зависимости от типа письма и языка
- ✅ Поддерживает типы: `'welcome' | 'shift-notice'`
- ✅ Поддерживает языки: `'ru' | 'uk' | 'en'`
- ✅ Fallback на `'ru'` если locale невалиден
- ✅ Дополнительная функция `getTemplateIdsForType()` для получения всех template_id для типа

**Примечание:** Template ID пока являются заглушками (например, `'welcome-ru-template-id'`). Позже нужно будет заменить на реальные ID из Resend.

## 📋 Инструкция по применению

### 1. Применить SQL-миграцию

1. Откройте **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Скопируйте весь файл `supabase/migrations/008_add_locale_to_profiles.sql`
3. Вставьте и выполните

### 2. Проверка

```sql
-- Проверка колонки locale
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'locale';
-- Должно вернуть: locale | text | 'ru' | NO

-- Проверка функции
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_user';
-- Должно вернуть 1 строку

-- Проверка триггера
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_metadata_updated';
-- Должно вернуть 1 строку
```

### 3. Тестирование

1. Зарегистрируйте нового пользователя с разными языками интерфейса
2. Проверьте, что `locale` сохраняется в `profiles`:

```sql
SELECT id, email, locale 
FROM profiles 
WHERE email = 'test@example.com';
```

3. Проверьте, что `locale` передается в метаданных:

```sql
SELECT id, email, raw_user_meta_data->>'locale' as locale_meta
FROM auth.users 
WHERE email = 'test@example.com';
```

## 🔍 Использование утилит

### Пример использования `getUserLocale`:

```typescript
import { getUserLocale } from '@/lib/users/getUserLocale';

// В API route или server component
const locale = await getUserLocale(userId);
// Возвращает: 'ru' | 'uk' | 'en'
```

### Пример использования `getTemplateId`:

```typescript
import { getTemplateId } from '@/lib/users/emailTemplates';
import { getUserLocale } from '@/lib/users/getUserLocale';

// Получаем locale пользователя
const locale = await getUserLocale(userId);

// Получаем template_id для письма
const templateId = getTemplateId('welcome', locale);
// Возвращает: 'welcome-ru-template-id' | 'welcome-uk-template-id' | 'welcome-en-template-id'
```

## 📝 Примечания

- **Маппинг языков:** `'ua'` (из Language provider) автоматически маппится в `'uk'` (для API и БД)
- **Значение по умолчанию:** `'ru'` используется везде, если locale не указан или невалиден
- **Синхронизация:** Автоматическая через SQL-триггеры, не требует дополнительного кода
- **RLS:** Политики не изменены, так как `locale` доступна через существующие права доступа

## ✅ Результат

- ✅ Колонка `locale` добавлена в `profiles`
- ✅ `locale` передается в `signUp` через метаданные
- ✅ SQL-триггер автоматически синхронизирует `locale` из метаданных в БД
- ✅ Утилиты для получения locale и template_id созданы
- ✅ Типы TypeScript не ломаются, все компилируется


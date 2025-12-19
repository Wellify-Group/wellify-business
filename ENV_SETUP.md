# Настройка Environment Variables для Supabase

## Обзор

Проект использует единый модуль `lib/supabase/env.ts` для управления переменными окружения Supabase. Поддерживается разделение между Production (MAIN) и Preview/Development (DEV) окружениями на Vercel.

## Логика выбора переменных

### На Vercel:
- **Production** (`VERCEL_ENV=production`): использует `*_MAIN` переменные
- **Preview/Development** (`VERCEL_ENV=preview` или `development`): использует `*_DEV` переменные

### Fallback:
Если переменные с суффиксом `_MAIN`/`_DEV` не найдены, используются стандартные переменные без суффикса.

## Переменные окружения

### Публичные (Client + Server)

#### Для Production (MAIN):
```
NEXT_PUBLIC_SUPABASE_URL_MAIN=https://sdkdzphjtrajjmylakma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_MAIN=<anon_key_jwt>
```

#### Для Preview/Development (DEV):
```
NEXT_PUBLIC_SUPABASE_URL_DEV=https://hbqnkgkkbytyahhnaniu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV=<anon_key_jwt>
```

#### Fallback (для локальной разработки):
```
NEXT_PUBLIC_SUPABASE_URL=<supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key_jwt>
```

### Серверные (Server-only)

#### Для Production (MAIN):
```
SUPABASE_SERVICE_ROLE_KEY_MAIN=<service_role_jwt>
```

#### Для Preview/Development (DEV):
```
SUPABASE_SERVICE_ROLE_KEY_DEV=<service_role_jwt>
```

#### Fallback (для локальной разработки):
```
SUPABASE_SERVICE_ROLE_KEY=<service_role_jwt>
```

## Настройка на Vercel

### Production Environment

1. Перейдите в **Settings → Environment Variables**
2. Добавьте следующие переменные для **Production**:
   - `NEXT_PUBLIC_SUPABASE_URL_MAIN`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY_MAIN`
   - `SUPABASE_SERVICE_ROLE_KEY_MAIN`

### Preview Environment

1. В тех же **Settings → Environment Variables**
2. Добавьте следующие переменные для **Preview**:
   - `NEXT_PUBLIC_SUPABASE_URL_DEV`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV`
   - `SUPABASE_SERVICE_ROLE_KEY_DEV`

**Важно:** Убедитесь, что переменные привязаны к правильным окружениям (Production vs Preview).

## Локальная разработка

Создайте файл `.env.local` в корне проекта:

```bash
# Для локальной разработки используйте стандартные переменные (fallback)
NEXT_PUBLIC_SUPABASE_URL=https://hbqnkgkkbytyahhnaniu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_dev_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_dev_service_role_key>
```

Или используйте переменные с суффиксом `_DEV`:

```bash
NEXT_PUBLIC_SUPABASE_URL_DEV=https://hbqnkgkkbytyahhnaniu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV=<your_dev_anon_key>
SUPABASE_SERVICE_ROLE_KEY_DEV=<your_dev_service_role_key>
```

## Безопасность

⚠️ **ВАЖНО:**
- Никогда не коммитьте `.env.local` в репозиторий
- Service Role Key имеет полный доступ к базе данных — храните его в секретах
- На Vercel используйте Environment Variables, а не хардкод в коде
- Все хардкоды ключей удалены из кода (см. `lib/supabase/admin.ts`)

## Проверка конфигурации

После настройки переменных:

1. **Локально:** Запустите `npm run build` — сборка должна пройти успешно
2. **На Vercel:** Проверьте логи деплоя — не должно быть ошибок о missing env variables
3. **В runtime:** Проверьте логи API routes — они должны логировать выбранный `supabaseUrl` (без ключей)

## Troubleshooting

### Ошибка: "Missing Supabase URL"
- Проверьте, что переменные установлены для правильного окружения
- Убедитесь, что имена переменных написаны правильно (регистр важен)

### Ошибка: "Missing Supabase Service Role Key"
- Проверьте, что `SUPABASE_SERVICE_ROLE_KEY_MAIN`/`_DEV` установлены на Vercel
- Убедитесь, что переменные привязаны к Production/Preview соответственно

### Build проходит, но runtime ошибки
- Проверьте логи Vercel Functions — там будут детали ошибок
- Убедитесь, что переменные доступны в runtime (не только в build time)


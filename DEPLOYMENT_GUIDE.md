# 🚀 Руководство по развертыванию: Vercel + Supabase + Railway

> **Основано на реальных ошибках и их решениях из проекта Wellify Business**

## 📋 Содержание

1. [Подготовка проекта](#подготовка-проекта)
2. [Vercel - Развертывание](#vercel---развертывание)
3. [Supabase - Настройка](#supabase---настройка)
4. [Railway - Настройка (опционально)](#railway---настройка-опционально)
5. [Переменные окружения](#переменные-окружения)
6. [Частые ошибки и решения](#частые-ошибки-и-решения)
7. [Чеклист перед деплоем](#чеклист-перед-деплоем)

---

## 🛠 Подготовка проекта

### 1. Проверка `package.json`

**❌ КРИТИЧЕСКАЯ ОШИБКА:** Trailing commas в JSON

```json
// ❌ НЕПРАВИЛЬНО - вызовет ошибку парсинга на Vercel
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",  // ← запятая в конце последнего элемента
  }
}

// ✅ ПРАВИЛЬНО
{
  "scripts": {
    "dev": "next dev",
    "build": "next build"  // ← без запятой
  }
}
```

**Правило:** JSON не допускает trailing commas в объектах и массивах.

### 2. Настройка `tsconfig.json`

**❌ ОШИБКА:** Скрипты попадают в билд Next.js

```json
// ✅ ПРАВИЛЬНО - исключите scripts из билда
{
  "compilerOptions": { /* ... */ },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": [
    "node_modules",
    "scripts/**",  // ← КРИТИЧЕСКИ ВАЖНО!
    "telegram-bot/**",
    "wellify-support-bot/**"
  ]
}
```

**Почему:** Скрипты (например, `scripts/auto-translate.ts`) не должны компилироваться в production билд.

### 3. Структура проекта

```
project-root/
├── app/                    # Next.js App Router
├── components/             # React компоненты
├── lib/                    # Утилиты и библиотеки
├── scripts/                # Скрипты (исключены из билда)
│   └── auto-translate.ts
├── public/                 # Статические файлы
├── .env.local             # Локальные переменные (не коммитить!)
├── .env.example           # Пример переменных (коммитить)
├── package.json
├── tsconfig.json
└── next.config.js
```

---

## ☁️ Vercel - Развертывание

### 1. Подключение репозитория

1. Зайдите на [vercel.com](https://vercel.com)
2. **New Project** → выберите репозиторий
3. Настройки:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (или оставьте пустым)
   - **Build Command:** `npm run build` (по умолчанию)
   - **Output Directory:** `.next` (по умолчанию)
   - **Install Command:** `npm install` (по умолчанию)

### 2. Переменные окружения в Vercel

**⚠️ ВАЖНО:** Добавьте ВСЕ переменные ДО первого деплоя!

**Где добавить:**
- Project Settings → Environment Variables

**Какие переменные нужны:**

```bash
# Supabase (ОБЯЗАТЕЛЬНО)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Admin (для API routes)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Приложение
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Другие сервисы (если используются)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=AC...
```

**⚠️ КРИТИЧЕСКИ ВАЖНО:**
- `NEXT_PUBLIC_*` переменные доступны в браузере
- Без `NEXT_PUBLIC_` - только на сервере
- Добавьте переменные для **Production**, **Preview**, и **Development** окружений

### 3. Настройка билда

**Проблема:** TypeScript ошибки в скриптах ломают билд

**Решение:** Убедитесь, что `tsconfig.json` исключает `scripts/**`

```json
{
  "exclude": ["node_modules", "scripts/**"]
}
```

### 4. Проверка билда локально

**Перед пушем в main/dev:**

```bash
# 1. Проверьте JSON синтаксис
npm run build

# 2. Проверьте TypeScript
npx tsc --noEmit

# 3. Проверьте линтер
npm run lint
```

**Если билд падает локально - он упадет и на Vercel!**

---

## 🗄 Supabase - Настройка

### 1. Создание проекта

1. Зайдите на [supabase.com](https://supabase.com)
2. **New Project**
3. Заполните:
   - **Name:** название проекта
   - **Database Password:** сохраните пароль!
   - **Region:** выберите ближайший регион

### 2. Получение ключей

**Где найти:**

1. **Project Settings** → **API**
   - `URL` → это `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → это `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → это `SUPABASE_SERVICE_ROLE_KEY` (⚠️ НЕ показывайте в браузере!)

### 3. Настройка базы данных

**Создание таблиц:**

1. Зайдите в **SQL Editor**
2. Создайте таблицы (пример):

```sql
-- Включите расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица профилей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email TEXT,
  full_name TEXT
);

-- Включите RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Политики RLS
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 4. Настройка аутентификации

**Email аутентификация:**

1. **Authentication** → **Providers** → **Email**
2. Включите **Enable Email Provider**
3. Настройте **Email Templates** (опционально)

**OAuth (Google, GitHub и т.д.):**

1. **Authentication** → **Providers**
2. Выберите провайдера
3. Добавьте **Client ID** и **Client Secret**
4. Добавьте **Redirect URL** в Vercel:
   - `https://your-app.vercel.app/auth/callback`

### 5. Настройка Storage (если используется)

1. **Storage** → **Create a new bucket**
2. Настройте политики доступа
3. Используйте `supabase.storage.from('bucket-name')`

---

## 🚂 Railway - Настройка (опционально)

### 1. Создание проекта

1. Зайдите на [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Выберите репозиторий

### 2. Переменные окружения

**Добавьте те же переменные, что и в Vercel:**

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Настройка деплоя

**Build Command:** `npm run build`
**Start Command:** `npm start`
**Root Directory:** `./`

---

## 🔐 Переменные окружения

### Структура `.env.local` (локально)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Приложение
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Другие сервисы
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

### Структура `.env.example` (в репозитории)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Приложение
NEXT_PUBLIC_APP_URL=

# Другие сервисы
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
```

**⚠️ ВАЖНО:**
- `.env.local` в `.gitignore` (не коммитить!)
- `.env.example` в репозитории (без реальных значений)

---

## ❌ Частые ошибки и решения

### 1. Ошибка: `Expected double-quoted property name in JSON`

**Причина:** Trailing comma в `package.json`

**Решение:**
```json
// ❌ Неправильно
{
  "scripts": {
    "build": "next build",  // ← лишняя запятая
  }
}

// ✅ Правильно
{
  "scripts": {
    "build": "next build"  // ← без запятой
  }
}
```

### 2. Ошибка: `Property 'ru' is missing in type`

**Причина:** TypeScript ошибка в скриптах, которые попадают в билд

**Решение:**
```json
// tsconfig.json
{
  "exclude": ["node_modules", "scripts/**"]  // ← исключить scripts
}
```

### 3. Ошибка: `Missing NEXT_PUBLIC_SUPABASE_URL`

**Причина:** Переменные окружения не добавлены в Vercel

**Решение:**
1. Vercel → Project Settings → Environment Variables
2. Добавьте все `NEXT_PUBLIC_*` переменные
3. Передеплойте проект

### 4. Ошибка: `Set-Location` в PowerShell

**Причина:** Проблемы с путями, содержащими кириллицу

**Решение:**
- Используйте Git Bash вместо PowerShell
- Или используйте WSL (Windows Subsystem for Linux)

### 5. Ошибка: `Hydration mismatch`

**Причина:** Несоответствие между серверным и клиентским рендерингом

**Решение:**
```tsx
// Используйте suppressHydrationWarning для элементов, которые могут отличаться
<html lang="en" suppressHydrationWarning>
  <body suppressHydrationWarning>
    {/* ... */}
  </body>
</html>
```

### 6. Ошибка: `Module not found: Can't resolve '@supabase/ssr'`

**Причина:** Зависимости не установлены

**Решение:**
```bash
npm install @supabase/ssr @supabase/supabase-js
```

### 7. Ошибка: `Row Level Security policy violation`

**Причина:** Неправильные RLS политики в Supabase

**Решение:**
1. Проверьте политики в Supabase Dashboard
2. Убедитесь, что политики используют `auth.uid()`
3. Протестируйте запросы в SQL Editor

---

## ✅ Чеклист перед деплоем

### Подготовка кода

- [ ] Проверен `package.json` - нет trailing commas
- [ ] Проверен `tsconfig.json` - `scripts/**` исключены
- [ ] Локальный билд проходит: `npm run build`
- [ ] TypeScript проверка проходит: `npx tsc --noEmit`
- [ ] Линтер проходит: `npm run lint`
- [ ] Все `.env.local` переменные добавлены в `.env.example` (без значений)

### Vercel настройка

- [ ] Проект создан в Vercel
- [ ] Репозиторий подключен
- [ ] Все переменные окружения добавлены:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_APP_URL`
  - [ ] Другие необходимые переменные
- [ ] Переменные добавлены для всех окружений (Production, Preview, Development)

### Supabase настройка

- [ ] Проект создан в Supabase
- [ ] Таблицы созданы
- [ ] RLS политики настроены
- [ ] Аутентификация настроена (Email/OAuth)
- [ ] Redirect URLs добавлены в Supabase:
  - [ ] `https://your-app.vercel.app/auth/callback`
  - [ ] `http://localhost:3000/auth/callback` (для разработки)

### Тестирование

- [ ] Локально работает: `npm run dev`
- [ ] Аутентификация работает локально
- [ ] API routes работают локально
- [ ] После деплоя на Vercel:
  - [ ] Сайт открывается
  - [ ] Аутентификация работает
  - [ ] API routes работают
  - [ ] Нет ошибок в консоли браузера
  - [ ] Нет ошибок в Vercel логах

---

## 📚 Дополнительные ресурсы

### Документация

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Railway Documentation](https://docs.railway.app)

### Полезные команды

```bash
# Локальная разработка
npm run dev

# Проверка билда
npm run build
npm start

# Проверка типов
npx tsc --noEmit

# Линтинг
npm run lint

# Форматирование (если настроено)
npm run format
```

---

## 🆘 Поддержка

Если возникли проблемы:

1. Проверьте логи в Vercel Dashboard → Deployments → Logs
2. Проверьте логи в Supabase Dashboard → Logs
3. Проверьте консоль браузера (F12)
4. Убедитесь, что все переменные окружения добавлены
5. Проверьте, что локальный билд проходит

---

**Последнее обновление:** Декабрь 2024  
**Версия:** 1.0.0


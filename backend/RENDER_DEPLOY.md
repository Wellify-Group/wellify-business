# Инструкция по деплою Backend на Render

## Шаг 1: Создать PostgreSQL базу данных

1. Зайди на [Render Dashboard](https://dashboard.render.com)
2. Нажми **"New +"** → **"PostgreSQL"**
3. Настрой:
   - **Name**: `wellify-business-db` (или любое другое имя)
   - **Database**: `wellify_business` (или любое другое)
   - **User**: автоматически создастся
   - **Region**: выбери ближайший (например, `Frankfurt`)
   - **PostgreSQL Version**: `15` (или новее)
   - **Plan**: `Free` (для начала)
4. Нажми **"Create Database"**
5. **ВАЖНО**: Сохрани `Internal Database URL` - это `DATABASE_URL` для backend

## Шаг 2: Выполнить миграции

1. После создания базы, открой её в Render Dashboard
2. Перейди на вкладку **"Connect"**
3. Скопируй **"Internal Database URL"** (формат: `postgresql://user:password@host:5432/database`)
4. Выполни SQL из `backend/src/db/schema.sql`:
   - Открой **"Query"** вкладку в Render Dashboard
   - Или используй любой PostgreSQL клиент (pgAdmin, DBeaver, etc.)
   - Скопируй содержимое `backend/src/db/schema.sql`
   - Выполни SQL

## Шаг 3: Создать Web Service для Backend

1. В Render Dashboard нажми **"New +"** → **"Web Service"**
2. Подключи GitHub репозиторий:
   - Выбери репозиторий `Wellify-Business`
   - Нажми **"Connect"**
3. Настрой Web Service:
   - **Name**: `wellify-business-backend`
   - **Region**: тот же, что и для PostgreSQL
   - **Branch**: `main`
   - **Root Directory**: `backend` ⚠️ **ВАЖНО!**
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (для начала)
4. Нажми **"Create Web Service"**

## Шаг 4: Настроить переменные окружения

В настройках Web Service (`wellify-business-backend`) добавь переменные:

### Обязательные:

```
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://wellify-business.pages.dev

DATABASE_URL=<Internal Database URL из PostgreSQL>
JWT_SECRET=<сгенерируй случайную строку, минимум 32 символа>
JWT_EXPIRES_IN=7d

RESEND_API_KEY=<твой Resend API ключ>
RESEND_FROM_EMAIL=Wellify Business <noreply@wellifyglobal.com>

LOG_LEVEL=info
```

### Как получить значения:

1. **DATABASE_URL**: 
   - Открой PostgreSQL в Render Dashboard
   - Вкладка **"Connect"**
   - Скопируй **"Internal Database URL"**

2. **JWT_SECRET**: 
   - Сгенерируй случайную строку (можно использовать: `openssl rand -base64 32`)
   - Или используй онлайн генератор

3. **RESEND_API_KEY**: 
   - Зайди на [Resend Dashboard](https://resend.com/api-keys)
   - Скопируй API ключ

4. **FRONTEND_URL**: 
   - URL твоего Cloudflare Pages проекта
   - Например: `https://wellify-business.pages.dev`

## Шаг 5: Проверить деплой

1. После создания Web Service, Render автоматически начнёт деплой
2. Дождись завершения деплоя (обычно 2-5 минут)
3. Проверь логи в Render Dashboard
4. Открой URL Web Service (например: `https://wellify-business-backend.onrender.com`)
5. Должен вернуться ответ от `/health` endpoint

## Шаг 6: Настроить переменные в Cloudflare

В Cloudflare Pages добавь переменную:

```
NEXT_PUBLIC_API_URL=https://wellify-business-backend.onrender.com
```

Или если используешь кастомный домен:

```
NEXT_PUBLIC_API_URL=https://api.wellifyglobal.com
```

## Проверка работы

1. Открой `https://wellify-business-backend.onrender.com/health`
2. Должен вернуться JSON:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "database": "connected"
}
```

3. Если `database: "disconnected"` - проверь `DATABASE_URL`

## Troubleshooting

### Ошибка подключения к БД:
- Проверь, что `DATABASE_URL` использует **Internal Database URL** (не External)
- Проверь, что база данных создана и запущена
- Проверь логи в Render Dashboard

### Ошибка при деплое:
- Проверь, что `Root Directory` установлен в `backend`
- Проверь, что `package.json` находится в `backend/`
- Проверь логи сборки в Render Dashboard

### CORS ошибки:
- Проверь, что `FRONTEND_URL` правильно настроен
- Проверь, что в `backend/src/server.js` CORS настроен правильно


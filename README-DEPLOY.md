# 🚀 Wellify Business - Deployment Guide

Полная автоматизация деплоя backend на Render и frontend на Cloudflare Pages.

## 📋 Быстрый старт

### Linux/Mac

```bash
chmod +x deploy.sh
./deploy.sh
```

### Windows

```powershell
.\deploy.ps1
```

## 🎯 Что делает скрипт

Скрипт автоматически выполняет следующие шаги:

1. ✅ **Проверка зависимостей** - Node.js, npm, Render CLI, Wrangler
2. 🔐 **Аутентификация** - Login в Render и Cloudflare (через браузер)
3. 🗄️ **Деплой Backend** - Создание PostgreSQL и Web Service на Render
4. 📊 **Миграции БД** - Опциональный запуск миграций
5. 🏗️ **Сборка Frontend** - Build Next.js приложения
6. ☁️ **Деплой Frontend** - Публикация на Cloudflare Pages
7. 🔗 **Настройка переменных** - Установка `NEXT_PUBLIC_API_URL`

## 📦 Требования

### Обязательные

- **Node.js** 18+ и npm
- **Render CLI** - [Установка](https://render.com/docs/cli)
- **Wrangler** - Устанавливается автоматически

### Установка Render CLI

**Mac:**
```bash
brew install render
```

**Linux/Windows:**
Скачай с [render.com/docs/cli](https://render.com/docs/cli)

## 🔧 Ручная настройка (если скрипт не работает)

### 1. Backend на Render

1. Открой [Render Dashboard](https://dashboard.render.com)
2. Нажми "New +" → "Blueprint"
3. Подключи GitHub репозиторий
4. Выбери `render.yaml`
5. Нажми "Apply"

Или через CLI:
```bash
render blueprint launch render.yaml --name wellify-business
```

### 2. Миграции базы данных

1. Render Dashboard → PostgreSQL → `wellify-business-db`
2. Вкладка "Query"
3. Скопируй содержимое `backend/src/db/schema.sql`
4. Вставь и выполни

### 3. Frontend на Cloudflare Pages

1. Cloudflare Dashboard → Pages → "Create a project"
2. Подключи GitHub репозиторий
3. Настройки:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
   - **Root directory:** `/` (корень проекта)

### 4. Переменные окружения

**В Render (Backend):**
- `DATABASE_URL` - автоматически из PostgreSQL
- `JWT_SECRET` - автоматически генерируется
- `RESEND_API_KEY` - добавь вручную
- Остальные - из `render.yaml`

**В Cloudflare Pages (Frontend):**
- `NEXT_PUBLIC_API_URL` = `https://wellify-business-backend.onrender.com`

## 🔍 Проверка деплоя

### Backend Health Check

```bash
curl https://wellify-business-backend.onrender.com/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "database": "connected"
}
```

### Frontend

Открой в браузере:
```
https://wellify-business.pages.dev
```

### Проверка переменных окружения

**Render:**
```bash
render env list --service wellify-business-backend
```

**Cloudflare:**
```bash
wrangler pages project list
wrangler pages deployment list --project-name=wellify-business
```

## 🐛 Troubleshooting

### Backend не запускается

1. **Проверь логи:**
   ```bash
   render logs --service wellify-business-backend
   ```

2. **Проверь переменные окружения:**
   - `DATABASE_URL` должен быть Internal Database URL
   - `JWT_SECRET` должен быть установлен
   - `RESEND_API_KEY` должен быть установлен

3. **Проверь миграции:**
   - Убедись, что `schema.sql` выполнен
   - Проверь таблицы в Render Dashboard → Query

### Frontend не подключается к Backend

1. **Проверь CORS:**
   - В Render: `CORS_ORIGINS` должен включать frontend URL
   - В Render: `FRONTEND_URL` должен быть правильным

2. **Проверь переменную:**
   ```bash
   # В Cloudflare Dashboard
   NEXT_PUBLIC_API_URL = https://wellify-business-backend.onrender.com
   ```

3. **Проверь в браузере:**
   - Открой DevTools → Network
   - Проверь запросы к `/api/auth/*`
   - Убедись, что они идут на правильный URL

### Ошибки аутентификации

1. **Render CLI:**
   ```bash
   render logout
   render login
   ```

2. **Wrangler:**
   ```bash
   wrangler logout
   wrangler login
   ```

### База данных не подключается

1. **Проверь Internal Database URL:**
   - Render Dashboard → PostgreSQL → Internal Database URL
   - Должен начинаться с `postgresql://`

2. **Проверь переменную `DATABASE_URL`:**
   ```bash
   render env get DATABASE_URL --service wellify-business-backend
   ```

3. **Проверь SSL:**
   - В `backend/src/db/connection.js` должно быть `ssl: { rejectUnauthorized: false }`

## 📝 Полезные команды

### Render CLI

```bash
# Список сервисов
render services list

# Логи сервиса
render logs --service wellify-business-backend

# Переменные окружения
render env list --service wellify-business-backend
render env set KEY=value --service wellify-business-backend

# Перезапуск сервиса
render services restart --service wellify-business-backend
```

### Wrangler CLI

```bash
# Список проектов
wrangler pages project list

# Список деплоев
wrangler pages deployment list --project-name=wellify-business

# Переменные окружения
wrangler pages secret list --project-name=wellify-business
wrangler pages secret put KEY --project-name=wellify-business

# Логи
wrangler pages deployment tail --project-name=wellify-business
```

## 🔄 Обновление деплоя

### Backend

```bash
# Автоматически через Git push (если настроен auto-deploy)
git push origin main

# Или вручную
render services restart --service wellify-business-backend
```

### Frontend

```bash
# Автоматически через Git push (если настроен auto-deploy)
git push origin main

# Или вручную
npm run build
wrangler pages deploy .next --project-name=wellify-business
```

## 📚 Дополнительная информация

- **Backend README:** `backend/README.md`
- **Render Deploy Guide:** `backend/RENDER_DEPLOY.md`
- **Deployment Automation:** `DEPLOYMENT_AUTOMATION.md`
- **Final Status:** `FINAL_STATUS.md`

## 🆘 Поддержка

Если что-то не работает:

1. Проверь логи в Render Dashboard
2. Проверь логи в Cloudflare Dashboard
3. Проверь переменные окружения
4. Убедись, что миграции выполнены
5. Проверь health endpoint backend

## ✅ Чеклист после деплоя

- [ ] Backend health endpoint возвращает `{"status":"ok"}`
- [ ] Frontend открывается в браузере
- [ ] Регистрация пользователя работает
- [ ] Вход пользователя работает
- [ ] Верификация email работает
- [ ] Верификация телефона работает
- [ ] Переменные окружения настроены
- [ ] CORS настроен правильно

---

**Готово! 🎉** Твой проект задеплоен и готов к работе!

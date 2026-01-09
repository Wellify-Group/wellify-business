# ⚡ Быстрый деплой - 3 шага

## 🚀 Вариант 1: Автоматический (рекомендуется)

### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Windows:
```powershell
.\deploy.ps1
```

**Скрипт сам:**
- ✅ Проверит зависимости
- ✅ Попросит залогиниться в Render и Cloudflare
- ✅ Задеплоит backend
- ✅ Спросит про миграции
- ✅ Задеплоит frontend

## 🎯 Вариант 2: Вручную через Dashboard

### Шаг 1: Backend на Render (5 минут)

1. Открой [Render Dashboard](https://dashboard.render.com)
2. Нажми **"New +"** → **"Blueprint"**
3. Подключи GitHub репозиторий
4. Выбери файл `render.yaml`
5. Нажми **"Apply"**
6. Подожди 5-10 минут

### Шаг 2: Миграции БД (2 минуты)

1. Render Dashboard → PostgreSQL → `wellify-business-db`
2. Вкладка **"Query"**
3. Скопируй содержимое `backend/src/db/schema.sql`
4. Вставь и нажми **"Run"**

### Шаг 3: Frontend на Cloudflare (5 минут)

1. Открой [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Pages** → **"Create a project"**
3. Подключи GitHub репозиторий
4. Настройки:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
5. Нажми **"Save and Deploy"**

### Шаг 4: Переменные окружения (1 минута)

**В Render:**
- Открой Web Service → **Environment**
- Добавь `RESEND_API_KEY` (если ещё нет)

**В Cloudflare:**
- Pages → `wellify-business` → **Settings** → **Environment Variables**
- Добавь: `NEXT_PUBLIC_API_URL` = `https://wellify-business-backend.onrender.com`

## ✅ Проверка

```bash
# Backend
curl https://wellify-business-backend.onrender.com/health

# Frontend
# Открой https://wellify-business.pages.dev
```

## 🆘 Проблемы?

Смотри `README-DEPLOY.md` для детального troubleshooting.

---

**Готово! 🎉** Твой проект задеплоен!

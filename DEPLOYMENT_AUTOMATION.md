# Автоматизация деплоя

## Быстрый старт

### 1. Подготовка

```bash
# Убедись, что установлены необходимые инструменты
npm install -g wrangler
wrangler login
```

### 2. Деплой Backend на Render

**Вариант A: Через Render Dashboard (рекомендуется)**

1. Открой [Render Dashboard](https://dashboard.render.com)
2. Следуй инструкции в `backend/RENDER_DEPLOY.md`

**Вариант B: Через Render CLI (если установлен)**

```bash
# Установи Render CLI
npm install -g render-cli

# Залогинься
render login

# Создай PostgreSQL базу
render postgres create --name wellify-business-db

# Создай Web Service
render services create web \
  --name wellify-business-backend \
  --repo https://github.com/your-username/Wellify-Business \
  --branch main \
  --root-dir backend \
  --build-command "npm install" \
  --start-command "npm start"
```

### 3. Настройка переменных окружения

**В Render Dashboard:**

1. Открой созданный Web Service
2. Перейди в "Environment"
3. Добавь переменные из `backend/RENDER_DEPLOY.md`

**В Cloudflare Pages:**

1. Открой [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pages → wellify-business → Settings → Environment Variables
3. Добавь:
   ```
   NEXT_PUBLIC_API_URL=https://wellify-business-backend.onrender.com
   ```

### 4. Выполнение миграций

**Через Render Dashboard:**

1. Открой PostgreSQL базу
2. Перейди на вкладку "Query"
3. Скопируй содержимое `backend/src/db/schema.sql`
4. Выполни SQL

**Через psql (если есть доступ):**

```bash
# Получи External Database URL из Render
psql <EXTERNAL_DATABASE_URL> < backend/src/db/schema.sql
```

### 5. Проверка деплоя

```bash
# Проверь health endpoint
curl https://wellify-business-backend.onrender.com/health

# Должен вернуться:
# {"status":"ok","timestamp":"...","database":"connected"}
```

## Скрипты

### `scripts/deploy-backend.sh`

Интерактивный скрипт с инструкциями по деплою.

```bash
chmod +x scripts/deploy-backend.sh
./scripts/deploy-backend.sh
```

### `scripts/setup-cloudflare-env.sh`

Настройка переменных окружения в Cloudflare.

```bash
chmod +x scripts/setup-cloudflare-env.sh
export RENDER_API_URL=https://wellify-business-backend.onrender.com
./scripts/setup-cloudflare-env.sh
```

## Troubleshooting

### Backend не запускается

1. Проверь логи в Render Dashboard
2. Убедись, что `DATABASE_URL` правильный (Internal, не External)
3. Проверь, что миграции выполнены

### CORS ошибки

1. Проверь `FRONTEND_URL` в Render
2. Убедись, что URL правильный (без слеша в конце)

### Middleware не работает

1. Проверь, что `NEXT_PUBLIC_API_URL` установлен в Cloudflare
2. Убедись, что токен сохраняется в cookies (проверь `lib/api/client.ts`)

## Чеклист деплоя

- [ ] PostgreSQL база создана на Render
- [ ] Миграции выполнены (`backend/src/db/schema.sql`)
- [ ] Web Service создан на Render
- [ ] Все переменные окружения настроены в Render
- [ ] `NEXT_PUBLIC_API_URL` настроен в Cloudflare Pages
- [ ] Health endpoint возвращает `{"status":"ok"}`
- [ ] Frontend может подключиться к backend
- [ ] Регистрация работает
- [ ] Вход работает
- [ ] Верификация email работает


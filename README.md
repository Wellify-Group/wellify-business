# WELLIFY Business

Платформа для управления бизнесом: контроль смен, выручки, сотрудников и аналитики в реальном времени.

## Технологический стек

- **Frontend**: Next.js 14 (App Router, TypeScript, Vercel)
- **Backend**: Next.js API Routes
- **База данных**: Supabase (Postgres)
- **Аутентификация**: Supabase Auth
- **Telegram-бот**: Node.js/Telegraf (Railway)
- **Email**: Resend
- **DNS/SSL**: Cloudflare

## Переменные окружения

Все различия между dev и prod окружениями задаются через переменные окружения. В репозитории есть шаблон `.env.example` с полным списком необходимых переменных.

### Настройка окружений

#### Vercel (Frontend)

В настройках проекта Vercel добавьте следующие переменные:

- `NEXT_PUBLIC_APP_URL` - URL приложения (например, `https://business.wellifyglobal.com`)
- `NEXT_PUBLIC_SUPABASE_URL` - URL проекта Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon ключ Supabase
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` - Username Telegram-бота
- `NEXT_PUBLIC_TELEGRAM_API_URL` - URL Telegram API (Railway)
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role ключ Supabase (только для сервера)
- `RESEND_API_KEY` - API ключ Resend
- `RESEND_FROM_EMAIL` - Email отправителя
- И другие переменные из `.env.example`

#### Railway (Telegram-бот)

В настройках проекта Railway добавьте:

- `TELEGRAM_BOT_TOKEN` - Токен Telegram-бота
- `TELEGRAM_BOT_USERNAME` - Username бота
- `SUPABASE_URL` - URL проекта Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role ключ Supabase
- `APP_BASE_URL` - Базовый URL фронтенда (для формирования ссылок)
- `SUPPORT_MANAGERS_CHAT_ID` - ID чата менеджеров поддержки

### Важно

- **НЕ** добавляйте секретные ключи в `.env.example` - это только шаблон
- Все значения задаются через интерфейсы Vercel и Railway
- В коде нет хардкодов доменов, URL или токенов - всё читается из переменных окружения

## Конфигурация

Проект использует единый конфиг в `lib/config/appConfig.ts`:

- `appConfig` - для клиентской части (браузер), использует только `NEXT_PUBLIC_*` переменные
- `serverConfig` - для серверной части (API routes, server actions), может использовать серверные переменные

## Разработка

```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Сборка для production
npm run build

# Запуск production сборки
npm start
```

## Структура проекта

- `app/` - Next.js App Router (страницы, API routes)
- `components/` - React компоненты
- `lib/` - Утилиты, конфиги, сервисы
- `lib/config/` - Конфигурация приложения
- `supabase/` - Миграции базы данных

## Лицензия

© 2025 WELLIFY Group. Все права защищены.
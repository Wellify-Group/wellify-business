# Wellify Business Backend

Express.js backend API для замены Supabase.

## Технологии

- **Express.js** - Web framework
- **PostgreSQL** - База данных (Render)
- **JWT** - Аутентификация
- **Resend** - Email отправка
- **Winston** - Логирование

## Установка

```bash
cd backend
npm install
```

## Настройка

1. Скопируй `.env.example` в `.env`
2. Заполни переменные окружения:
   - `DATABASE_URL` - из Render PostgreSQL
   - `JWT_SECRET` - секретный ключ для JWT
   - `RESEND_API_KEY` - ключ Resend API
   - `FRONTEND_URL` - URL фронтенда (Cloudflare Pages)

## Запуск

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Деплой на Render

1. Создай новый **Web Service** в Render
2. Подключи GitHub репозиторий
3. Настрой:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Добавь переменные окружения из `.env`
5. Подключи PostgreSQL database из Render

## API Endpoints

### Auth
- `POST /api/auth/signup` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/user` - Получить текущего пользователя

### Users
- `GET /api/users` - Список пользователей
- `GET /api/users/:id` - Получить пользователя

### Profiles
- `GET /api/profiles/:id` - Получить профиль
- `PATCH /api/profiles/:id` - Обновить профиль

### Email
- `POST /api/email/send-verification` - Отправить код верификации

### SMS
- `POST /api/sms/send` - Отправить SMS (заглушка)

## Миграции

```bash
npm run migrate
```

Или выполни `src/db/schema.sql` вручную в PostgreSQL.


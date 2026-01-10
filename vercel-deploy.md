# Инструкция по деплою на Vercel

## 1. Установка Vercel CLI

Установите Vercel CLI глобально через npm:

```powershell
npm install -g vercel
```

## 2. Логин в Vercel

Войдите в аккаунт Vercel через CLI:

```powershell
vercel login
```

Следуйте инструкциям в терминале для авторизации через браузер.

## 3. Первый деплой

Для первого деплоя в production выполните:

```powershell
vercel --prod
```

Или просто:

```powershell
vercel
```

и выберите опцию production при запросе.

**Важно:** При первом деплое Vercel задаст несколько вопросов:
- Link to existing project? (Y/n) - выберите `n` для создания нового проекта
- What's your project's name? - введите `wellify-business` (или другое имя)
- In which directory is your code located? - оставьте `.` (текущая директория)
- Want to override the settings? - выберите `N` (используем настройки из vercel.json)

## 4. Environment Variables в Vercel Dashboard

После первого деплоя добавьте следующие переменные окружения в Vercel Dashboard:

### Как добавить Environment Variables:
1. Перейдите на [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите ваш проект `wellify-business`
3. Перейдите в Settings → Environment Variables
4. Добавьте следующие переменные для **Production**, **Preview** и **Development**:

### Список переменных:

```
NEXT_PUBLIC_API_URL=https://wellify-business-backend.onrender.com
NEXT_PUBLIC_APP_URL=https://wellify-business.vercel.app
```

**Дополнительно** (если используются в вашем проекте):

```
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=<ваш_username>
NEXT_PUBLIC_TELEGRAM_API_URL=<ваш_api_url>
NEXT_PUBLIC_TELEGRAM_API_URL_MAIN=<main_url>
NEXT_PUBLIC_TELEGRAM_API_URL_DEV=<dev_url>
NEXT_PUBLIC_SITE_URL=https://wellify-business.vercel.app
```

**Важно:** После добавления переменных окружения нужно **пересобрать проект**. Это можно сделать:
- Через Dashboard: Deployments → выберите последний деплой → три точки (⋮) → Redeploy
- Или через CLI: `vercel --prod` (повторный деплой)

## 5. Что делать после первого деплоя

1. ✅ Проверьте URL вашего приложения (будет показан в терминале после деплоя)
2. ✅ Убедитесь, что все Environment Variables добавлены
3. ✅ Проверьте, что приложение работает корректно
4. ✅ Настройте Custom Domain (опционально) в Settings → Domains
5. ✅ Настройте автоматический деплой из GitHub (опционально):
   - Settings → Git → Connect Git Repository
   - Выберите ваш репозиторий
   - Каждый push в `main` будет автоматически деплоить на production

## 6. Автоматический деплой из GitHub

Для автоматического деплоя при каждом push:

1. Перейдите в Vercel Dashboard → Settings → Git
2. Нажмите "Connect Git Repository"
3. Выберите ваш репозиторий на GitHub
4. Настройте:
   - Production Branch: `main`
   - Build Command: `npm run build` (уже указано в vercel.json)
   - Output Directory: `.next` (используется по умолчанию для Next.js)

После этого каждый push в `main` будет автоматически деплоиться на production.

## 7. Полезные команды Vercel CLI

```powershell
# Проверить статус деплоя
vercel ls

# Посмотреть логи последнего деплоя
vercel logs

# Открыть проект в браузере
vercel open

# Откатить к предыдущему деплою
vercel rollback

# Удалить проект
vercel remove
```

## Примечания

- Vercel автоматически определяет Next.js и использует правильные настройки сборки
- Переменные окружения с префиксом `NEXT_PUBLIC_*` автоматически доступны в браузере
- После изменения Environment Variables нужно пересобрать проект
- Vercel предоставляет бесплатный план с достаточным количеством ресурсов для небольших проектов

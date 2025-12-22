# Настройка подтверждения email через Railway

## Что было сделано

1. ✅ Создан эндпоинт `/api/auth/confirm-email` для обработки подтверждения email через Railway
2. ✅ Изменен `emailRedirectTo` в регистрации для использования Railway URL
3. ✅ Реализована логика определения первого/повторного клика
4. ✅ Интегрированы страницы успеха/повторного клика

## Как это работает

### Процесс подтверждения email:

1. **Пользователь регистрируется** → Supabase отправляет письмо через Resend
2. **Пользователь кликает на ссылку в письме** → Ссылка ведет на Railway эндпоинт `/api/auth/confirm-email?code=...`
3. **Railway эндпоинт обрабатывает запрос:**
   - Вызывает `exchangeCodeForSession(code)` в Supabase
   - Если успешно → **первый клик** → редирект на `/auth/email-confirmed?status=success`
   - Если ошибка "already confirmed" → **повторный клик** → редирект на `/auth/email-confirmed?status=already_confirmed`
   - Если код недействителен → редирект на `/auth/email-confirmed?status=invalid_or_expired`
4. **Фронтенд показывает соответствующее сообщение** на странице `/auth/email-confirmed`

## Что нужно настроить в Supabase

### Для DEV окружения:

1. Зайдите в Supabase Dashboard → ваш DEV проект
2. Перейдите в **Authentication** → **URL Configuration**
3. Добавьте в **Redirect URLs**:
   ```
   https://dev.wellifyglobal.com/api/auth/confirm-email
   ```
4. **Site URL** должен быть:
   ```
   https://dev.wellifyglobal.com
   ```

### Для PRODUCTION (main) окружения:

1. Зайдите в Supabase Dashboard → ваш PRODUCTION проект
2. Перейдите в **Authentication** → **URL Configuration**
3. Добавьте в **Redirect URLs**:
   ```
   https://business.wellifyglobal.com/api/auth/confirm-email
   ```
4. **Site URL** должен быть:
   ```
   https://business.wellifyglobal.com
   ```

## Переменные окружения

Убедитесь, что в Railway сервисе `wellify-auth-service` установлены следующие переменные:

### Для DEV:
- `APP_BASE_URL=https://dev.wellifyglobal.com`
- `NEXT_PUBLIC_APP_URL=https://dev.wellifyglobal.com`
- `SUPABASE_URL` - URL вашего DEV Supabase проекта
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key вашего DEV проекта

### Для PRODUCTION (main):
- `APP_BASE_URL=https://business.wellifyglobal.com`
- `NEXT_PUBLIC_APP_URL=https://business.wellifyglobal.com`
- `SUPABASE_URL` - URL вашего PRODUCTION Supabase проекта
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key вашего PRODUCTION проекта

## Как проверить что все работает

1. Зарегистрируйте нового пользователя
2. Проверьте письмо в почте
3. Кликните на ссылку подтверждения
4. Должна открыться страница "E-mail подтверждён" (первый клик)
5. Кликните на ссылку еще раз (или обновите страницу)
6. Должна открыться страница "E-mail уже подтверждён" (повторный клик)

## Технические детали

### Определение первого/повторного клика:

- **Первый клик**: `exchangeCodeForSession(code)` успешно выполняется, `email_confirmed_at` устанавливается в текущий момент
- **Повторный клик**: `exchangeCodeForSession(code)` возвращает ошибку типа "already confirmed" или "token already used"

### Редиректы:

- Успешное подтверждение (первый раз): `/auth/email-confirmed?status=success`
- Уже подтверждено (повторный клик): `/auth/email-confirmed?status=already_confirmed`
- Недействительная ссылка: `/auth/email-confirmed?status=invalid_or_expired`

## Важно

- Railway эндпоинт работает как прокси между Supabase и фронтендом
- Все запросы к Supabase идут через Railway, что позволяет контролировать логику подтверждения
- Логика определения первого/повторного клика основана на ошибках Supabase API
- Страницы результатов уже существуют в проекте (`/auth/email-confirmed`)


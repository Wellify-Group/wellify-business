# Настройка подтверждения email

## Flow подтверждения email

1. Пользователь регистрируется → `signUp()` отправляет письмо
2. Пользователь кликает по ссылке в письме → Supabase редиректит на `/auth/confirm?code=...`
3. Серверный route `/auth/confirm` вызывает `exchangeCodeForSession(code)` → создает сессию
4. После успешного обмена → редирект на `/auth/email-confirmed` (UI страница)
5. Страница `/auth/email-confirmed` показывает успешное подтверждение и получает email через `getUser()`

## Важно: Настройка шаблона email в Supabase Dashboard

Для работы подтверждения email необходимо настроить шаблон в Supabase Dashboard:

1. Перейдите в Supabase Dashboard → Authentication → Email Templates
2. Выберите шаблон "Confirm signup"
3. В поле "Redirect URL" используйте следующую ссылку:

```
{{ .SiteURL }}/auth/confirm
```

**Важно:** 
- Используйте `/auth/confirm` (серверный route)
- Supabase автоматически добавит параметр `code` к URL
- Никаких дополнительных параметров не требуется

## Архитектура

- **app/auth/confirm/route.ts** - серверный route, который делает `exchangeCodeForSession(code)`
- **app/auth/email-confirmed/page.tsx** - UI страница, показывает успешное подтверждение
- Никаких client-side confirm/verify логик
- Email подтверждается ТОЛЬКО по клику по ссылке из письма

## Безопасность: Ротация Service Role Keys

⚠️ **КРИТИЧНО:** Если service role keys были засвечены в репозитории (включая историю коммитов), их необходимо срочно ротировать:

1. Перейдите в Supabase Dashboard → Settings → API
2. Нажмите "Rotate" рядом с Service Role Key
3. Обновите переменную `SUPABASE_SERVICE_ROLE_KEY` в Vercel Environment Variables для всех окружений (Production/Preview/Development)

## Переменные окружения

Все переменные используют одинаковые имена для всех окружений. Различия задаются через Vercel Environment Scopes:

- `NEXT_PUBLIC_SUPABASE_URL` - URL Supabase проекта
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon (публичный) ключ
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role ключ (только для сервера)

**Production scope:** значения для production Supabase проекта
**Preview scope:** значения для development/preview Supabase проекта
**Development scope:** значения для локальной разработки

## Удаление зависимости от PKCE

Старый flow использовал `exchangeCodeForSession(code)` на клиенте, который требовал `code_verifier` из localStorage того же браузера.

Новый flow использует серверный route `/auth/confirm`, который делает `exchangeCodeForSession(code)` на сервере. Это работает в любом браузере/устройстве, так как сервер обрабатывает обмен кода на сессию.

# Настройка подтверждения email

## Важно: Настройка шаблона email в Supabase Dashboard

Для работы подтверждения email через token_hash (без PKCE) необходимо обновить шаблон email в Supabase Dashboard:

1. Перейдите в Supabase Dashboard → Authentication → Email Templates
2. Выберите шаблон "Confirm signup"
3. В поле "Redirect URL" используйте следующую ссылку:

```
{{ .SiteURL }}/email-confirmed?token_hash={{ .TokenHash }}&type=signup
```

**Важно:** 
- Используйте `/email-confirmed` (не `/auth/email-confirmed`)
- Параметры `token_hash` и `type` обязательны
- `type=signup` для подтверждения регистрации

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

## Flow подтверждения email

1. Пользователь регистрируется → `signUp()` отправляет письмо
2. Пользователь переходит по ссылке из письма → `/email-confirmed?token_hash=...&type=signup`
3. Страница `/email-confirmed` вызывает `verifyOtp({ token_hash, type })` → работает в любом браузере
4. После успешного подтверждения вызывается `/api/auth/email-sync-profile` → ставит `email_verified=true` в profiles
5. Автоматический redirect на `/auth/register?step=3`
6. Polling на клиенте проверяет подтверждение через `/api/auth/check-email-confirmed?userId=...`

## Удаление зависимости от PKCE

Старый flow использовал `exchangeCodeForSession(code)`, который требовал `code_verifier` из localStorage того же браузера.

Новый flow использует `verifyOtp({ token_hash, type })`, который работает в любом браузере/устройстве, так как `token_hash` самодостаточен.


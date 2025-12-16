# Cloudflare Configuration Guide

## Обзор

Cloudflare используется для DNS, SSL/TLS и защиты WELLIFY Business приложения.

## Рекомендуемые настройки

### 1. SSL/TLS

**Рекомендация**: `Full (strict)`

- Перейдите в **SSL/TLS** → **Overview**
- Установите режим: **Full (strict)**
- Убедитесь, что origin сервер (Vercel) поддерживает HTTPS

**Почему Full (strict)**:
- Максимальная безопасность
- Проверка сертификата origin сервера
- Vercel автоматически предоставляет валидные сертификаты

### 2. Redirect Rules

**ВАЖНО**: Не создавайте редиректы, которые могут сломать Supabase auth callbacks.

#### Разрешенные редиректы:
- HTTP → HTTPS (автоматически через SSL/TLS режим)
- www → non-www (или наоборот) - только если нужно

#### Запрещенные редиректы:
- ❌ Редиректы для `/auth/callback` - сломает OAuth flow
- ❌ Редиректы для `/api/*` - сломает API endpoints
- ❌ Редиректы с query параметрами - могут потерять `code` и `token_hash`

### 3. WAF (Web Application Firewall)

#### Правила для Telegram Webhook

Создайте правило, разрешающее запросы к Telegram webhook endpoint:

1. Перейдите в **Security** → **WAF**
2. Создайте Custom Rule:

```
(http.request.uri.path eq "/api/telegram/webhook")
```

**Действие**: Allow (или Skip)

**Почему**: Telegram Bot API отправляет webhook запросы, которые не должны блокироваться.

#### Правила для Supabase Auth

Разрешите запросы от Supabase:

1. Создайте правило для Supabase домена:

```
(http.host eq "business.wellifyglobal.com" and http.request.uri.path contains "/auth/")
```

**Действие**: Allow

### 4. Cache Rules

**ВАЖНО**: Не кешируйте auth endpoints и API routes.

#### Правила кеширования:

1. Перейдите в **Caching** → **Configuration**
2. Создайте Page Rule или Cache Rule:

**Правило 1: Не кешировать auth endpoints**
```
URL Pattern: *business.wellifyglobal.com/auth/*
Settings:
  - Cache Level: Bypass
  - Edge Cache TTL: Bypass
```

**Правило 2: Не кешировать API routes**
```
URL Pattern: *business.wellifyglobal.com/api/*
Settings:
  - Cache Level: Bypass
  - Edge Cache TTL: Bypass
```

**Правило 3: Кешировать статические файлы**
```
URL Pattern: *business.wellifyglobal.com/_next/static/*
Settings:
  - Cache Level: Standard
  - Edge Cache TTL: 1 month
```

### 5. DNS Records

#### Обязательные записи для Resend Email

Для работы Resend email с доменом `wellifyglobal.com`:

1. **SPF Record** (TXT):
```
v=spf1 include:_spf.resend.com ~all
```

2. **DKIM Record** (TXT):
   - Получите DKIM ключ из Resend Dashboard → Domains → wellifyglobal.com
   - Добавьте TXT запись с именем, указанным в Resend (обычно `resend._domainkey`)

3. **DMARC Record** (TXT):
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@wellifyglobal.com; ruf=mailto:dmarc@wellifyglobal.com; pct=100
```

**Имя записи**: `_dmarc.wellifyglobal.com`

#### Проверка DNS записей

Используйте онлайн инструменты:
- [MXToolbox SPF Checker](https://mxtoolbox.com/spf.aspx)
- [MXToolbox DMARC Checker](https://mxtoolbox.com/dmarc.aspx)
- [DKIM Validator](https://dkimvalidator.com/)

### 6. Rate Limiting

Настройте rate limiting для защиты от DDoS:

1. Перейдите в **Security** → **Rate Limiting**
2. Создайте правило:

```
Rule Name: API Protection
Match: (http.request.uri.path contains "/api/")
Requests: 100 per minute
Action: Block
```

**Исключения**:
- `/api/telegram/webhook` - может получать много запросов от Telegram
- `/api/auth/callback` - OAuth callbacks не должны блокироваться

### 7. Page Rules (Legacy) или Transform Rules

Если используете Page Rules (legacy), создайте правила:

1. **Auth endpoints**:
   - URL: `*business.wellifyglobal.com/auth/*`
   - Settings: Cache Level = Bypass

2. **API routes**:
   - URL: `*business.wellifyglobal.com/api/*`
   - Settings: Cache Level = Bypass

### 8. Security Headers

Рекомендуемые заголовки безопасности:

1. Перейдите в **Rules** → **Transform Rules** → **Response Headers**
2. Добавьте правила:

**Strict-Transport-Security**:
```
Header: Strict-Transport-Security
Value: max-age=31536000; includeSubDomains; preload
```

**X-Content-Type-Options**:
```
Header: X-Content-Type-Options
Value: nosniff
```

**X-Frame-Options**:
```
Header: X-Frame-Options
Value: SAMEORIGIN
```

### 9. Проверка конфигурации

После настройки проверьте:

1. ✅ Auth flow работает (регистрация/логин)
2. ✅ OAuth callbacks работают (`/auth/callback`)
3. ✅ Telegram webhook получает запросы
4. ✅ Email отправляется через Resend
5. ✅ Статические файлы кешируются
6. ✅ API endpoints не кешируются

## Troubleshooting

### Auth callbacks не работают

**Причина**: Cloudflare блокирует или редиректит запросы.

**Решение**:
1. Проверьте, что нет редиректов для `/auth/callback`
2. Убедитесь, что WAF не блокирует Supabase домен
3. Проверьте, что кеширование отключено для auth endpoints

### Telegram webhook не работает

**Причина**: Cloudflare блокирует запросы от Telegram.

**Решение**:
1. Добавьте правило WAF для `/api/telegram/webhook`
2. Проверьте rate limiting правила
3. Убедитесь, что endpoint доступен по HTTPS

### Email не доставляется

**Причина**: DNS записи (SPF/DKIM/DMARC) не настроены.

**Решение**:
1. Проверьте SPF запись через MXToolbox
2. Проверьте DKIM запись (получите из Resend Dashboard)
3. Проверьте DMARC запись
4. Убедитесь, что записи применены (может занять до 48 часов)

## Чеклист перед релизом

- [ ] SSL/TLS режим: Full (strict)
- [ ] Нет редиректов для `/auth/*` и `/api/*`
- [ ] WAF правила для Telegram webhook
- [ ] Кеширование отключено для auth и API
- [ ] SPF запись настроена
- [ ] DKIM запись настроена
- [ ] DMARC запись настроена
- [ ] Rate limiting настроен (с исключениями)
- [ ] Security headers добавлены
- [ ] Тестирование auth flow
- [ ] Тестирование Telegram webhook
- [ ] Тестирование email доставки


# Инструкция по настройке Resend для отправки email

## Проблема: Код не отправляется на почту

Если код верификации не приходит на email, проверьте следующие настройки:

## 1. Получение API ключа Resend

1. Зайдите на [Resend.com](https://resend.com)
2. Войдите в аккаунт или создайте новый
3. Перейдите в **API Keys** → **Create API Key**
4. Укажите имя ключа (например: `wellify-business-production`)
5. Скопируйте API ключ (показывается только один раз!)

## 2. Настройка домена (важно!)

### Вариант 1: Использование домена Resend (для тестирования)

Resend предоставляет домен `onboarding.resend.dev` для тестирования:
- **From Email**: `onboarding@resend.dev`
- Работает сразу, без настройки
- **Ограничение**: Письма могут попадать в спам

### Вариант 2: Использование собственного домена (рекомендуется для production)

1. В Resend Dashboard перейдите в **Domains**
2. Нажмите **Add Domain**
3. Введите ваш домен (например: `wellifyglobal.com`)
4. Добавьте DNS записи в настройках вашего домена:
   - **SPF**: `v=spf1 include:resend.com ~all`
   - **DKIM**: записи из Resend Dashboard
   - **DMARC**: `v=DMARC1; p=none;`
5. Дождитесь верификации домена (обычно несколько минут)

## 3. Environment Variables для Render

Добавьте следующие переменные в **Render Dashboard** → **Backend Service** → **Environment**:

### Обязательные переменные:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Опциональные переменные:

```
RESEND_FROM_EMAIL=Wellify Business <noreply@wellifyglobal.com>
```

**Важно:**
- Если `RESEND_FROM_EMAIL` не указан, используется: `Wellify Business <noreply@wellifyglobal.com>`
- Email адрес должен быть верифицирован в Resend
- Для тестирования можно использовать: `onboarding@resend.dev`

## 4. Проверка настроек

### Шаг 1: Проверьте логи backend на Render

1. Откройте Render Dashboard → Backend Service → **Logs**
2. Найдите сообщения:
   - `✅ Resend API initialized` - значит API ключ установлен
   - `⚠️  Resend API key not configured` - значит ключ не установлен
   - `Failed to send verification email` - ошибка отправки

### Шаг 2: Проверьте Environment Variables

В Render Dashboard → Backend Service → **Environment** убедитесь что:
- `RESEND_API_KEY` установлен и начинается с `re_`
- `RESEND_FROM_EMAIL` установлен (если используете свой домен)

### Шаг 3: Тестовая отправка

Выполните тестовый запрос через curl или Postman:

```bash
curl -X POST https://your-backend.onrender.com/api/email/send-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "code": "123456",
    "language": "ru"
  }'
```

Ожидаемый ответ:
```json
{
  "success": true,
  "messageId": "xxx-xxx-xxx"
}
```

## 5. Частые проблемы и решения

### Проблема: "Resend API key not configured"

**Решение:**
1. Проверьте что `RESEND_API_KEY` установлен в Render Dashboard
2. Убедитесь что ключ начинается с `re_`
3. Перезапустите backend service после добавления переменной

### Проблема: "Email sending failed" или "Invalid from address"

**Решение:**
1. Проверьте что домен верифицирован в Resend
2. Убедитесь что `RESEND_FROM_EMAIL` использует верифицированный домен
3. Для тестирования используйте `onboarding@resend.dev`

### Проблема: Письма не приходят, но ошибок нет

**Решение:**
1. Проверьте папку **Спам** в почтовом ящике
2. Проверьте логи Resend Dashboard → **Emails** - там видно статус отправки
3. Убедитесь что email адрес получателя правильный

### Проблема: "Domain not verified"

**Решение:**
1. В Resend Dashboard → **Domains** проверьте статус домена
2. Убедитесь что все DNS записи добавлены правильно
3. Подождите несколько минут для обновления DNS

## 6. Development режим

В development режиме (когда `NODE_ENV=development`), если отправка email не удалась, код верификации будет возвращен в ответе API для отладки:

```json
{
  "success": true,
  "message": "Verification code saved (email sending failed)",
  "code": "123456",
  "error": "Email sending failed"
}
```

**⚠️ ВАЖНО:** Это работает только в development! В production код никогда не возвращается в ответе.

## 7. Мониторинг отправки

1. В Resend Dashboard → **Emails** можно увидеть:
   - Все отправленные письма
   - Статус доставки
   - Ошибки отправки
   - Время отправки

2. В Render Dashboard → **Logs** можно увидеть:
   - Успешные отправки: `Verification code email sent`
   - Ошибки: `Failed to send verification email`

## 8. Лимиты Resend

**Free план:**
- 3,000 emails/месяц
- 100 emails/день

**Pro план:**
- 50,000 emails/месяц
- Без лимита на день

Если достигнут лимит, отправка будет блокироваться. Проверьте использование в Resend Dashboard.

## 9. Альтернативные решения

Если Resend не подходит, можно использовать:
- **SendGrid** (требует изменения кода)
- **Mailgun** (требует изменения кода)
- **AWS SES** (требует изменения кода)

Для смены провайдера нужно обновить `backend/src/routes/email.js`.

## 10. Быстрая проверка

Выполните в Render Shell:

```bash
cd backend
node -e "console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET (' + process.env.RESEND_API_KEY.substring(0, 10) + '...)' : 'NOT SET');"
```

Если видите `NOT SET` - добавьте переменную в Render Dashboard.

---

**После настройки:**
1. Перезапустите backend service в Render
2. Проверьте логи на наличие `✅ Resend API initialized`
3. Попробуйте отправить код верификации
4. Проверьте папку Спам если письмо не пришло

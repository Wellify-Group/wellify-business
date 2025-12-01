# Настройка Telegram-интеграции для поддержки

## 1. Переменные окружения

Добавьте в `.env.local` (для локальной разработки) и в настройках Vercel (для продакшена):

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_SUPPORT_CHAT_ID=-1001234567890  # ID группы/канала (отрицательное число)
```

### Как получить TELEGRAM_BOT_TOKEN:
1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям
4. Скопируйте токен бота

### Как получить TELEGRAM_SUPPORT_CHAT_ID:
1. Добавьте бота в группу/канал поддержки
2. Отправьте любое сообщение в группу
3. Откройте в браузере: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Найдите `"chat":{"id":-1001234567890}` - это и есть ваш CHAT_ID (отрицательное число)

## 2. Настройка базы данных

Выполните SQL-миграцию в Supabase SQL Editor:

Файл: `supabase/migrations/001_support_telegram_integration.sql`

Или скопируйте содержимое файла и выполните в Supabase Dashboard → SQL Editor.

## 3. Настройка Telegram Webhook

После деплоя на Vercel, настройте webhook для бота:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.vercel.app/api/telegram/webhook"}'
```

Или используйте браузер:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.vercel.app/api/telegram/webhook
```

Проверить webhook:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

## 4. Проверка работы

1. Откройте виджет поддержки на сайте
2. Отправьте сообщение
3. Проверьте, что сообщение появилось в Telegram-группе
4. Ответьте в Telegram **reply** на сообщение бота
5. Проверьте, что ответ появился в виджете (через 5 секунд после отправки)

## Структура данных

### Таблицы в Supabase:

- `support_sessions` - сессии поддержки (cid, user_name, user_email, user_id)
- `support_messages` - сообщения (id, cid, direction: 'user' | 'admin', text, created_at)
- `support_telegram_threads` - связка telegram_message_id ↔ cid

### API Endpoints:

- `POST /api/support/chat/send` - отправка сообщения пользователя
- `GET /api/support/messages?cid=...` - получение истории сообщений
- `POST /api/telegram/webhook` - webhook от Telegram

## Troubleshooting

### Сообщения не отправляются в Telegram:
- Проверьте `TELEGRAM_BOT_TOKEN` и `TELEGRAM_SUPPORT_CHAT_ID`
- Убедитесь, что бот добавлен в группу и имеет права на отправку сообщений
- Проверьте логи в Vercel

### Ответы не приходят в виджет:
- Проверьте, что webhook настроен правильно
- Убедитесь, что отвечаете **reply** на сообщение бота
- Проверьте логи в Vercel
- Проверьте, что таблицы созданы в Supabase

### Polling не работает:
- Откройте DevTools → Network и проверьте запросы к `/api/support/messages`
- Проверьте, что `cid` сохраняется в localStorage
- Проверьте консоль браузера на ошибки


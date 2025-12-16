# Railway Telegram Bot Deployment Guide

## Обзор

Telegram бот для WELLIFY Business должен работать на Railway как отдельный сервис в **webhook режиме** для предотвращения 409 конфликтов.

## Требования

- Railway аккаунт
- Telegram Bot Token (от @BotFather)
- Отдельный Railway сервис для бота

## Конфигурация Railway

### 1. Создание сервиса

1. Создайте новый проект на Railway
2. Подключите репозиторий с Telegram bot кодом (или создайте отдельный сервис)
3. Убедитесь, что сервис слушает на порту `PORT` (Railway автоматически устанавливает эту переменную)

### 2. Обязательные переменные окружения

```bash
# Обязательные
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
TELEGRAM_BOT_USERNAME=wellify_business_bot
WEBHOOK_URL=https://your-railway-app.railway.app/telegram/webhook
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_BASE_URL=https://business.wellifyglobal.com

# Опциональные
SUPPORT_MANAGERS_CHAT_ID=your-chat-id
NODE_ENV=production
```

### 3. Режим работы бота

**ВАЖНО**: В production бот должен работать **ТОЛЬКО в webhook режиме**. Polling должен быть отключен.

#### Пример кода для бота (Node.js/Telegraf):

```typescript
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const webhookUrl = process.env.WEBHOOK_URL!;
const port = process.env.PORT || 3000;

// Проверка обязательных переменных
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

if (!webhookUrl && process.env.NODE_ENV === 'production') {
  console.error('❌ WEBHOOK_URL is required in production');
  process.exit(1);
}

// Режим работы
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // PRODUCTION: Webhook режим
  console.log('🚀 BOT MODE: webhook');
  
  // КРИТИЧЕСКАЯ ПРОВЕРКА: WEBHOOK_URL обязателен в production
  if (!webhookUrl) {
    console.error('❌ FATAL: WEBHOOK_URL is required in production');
    console.error('   Set WEBHOOK_URL environment variable in Railway');
    process.exit(1);
  }
  
  console.log(`📡 Webhook URL: ${webhookUrl}`);
  
  // Устанавливаем webhook при старте
  bot.telegram.setWebhook(webhookUrl).then(() => {
    console.log('✅ Webhook установлен успешно');
  }).catch((err) => {
    console.error('❌ Ошибка установки webhook:', err);
    process.exit(1);
  });
  
  // Запускаем Express сервер для приёма webhook
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  app.post('/telegram/webhook', (req, res) => {
    bot.handleUpdate(req.body);
    res.sendStatus(200);
  });
  
  app.listen(port, () => {
    console.log(`✅ Bot webhook server listening on port ${port}`);
  });
} else {
  // DEVELOPMENT: Polling режим (только для локальной разработки)
  console.log('🔧 BOT MODE: polling (development)');
  
  // В development можно использовать polling, но предупреждаем
  if (webhookUrl) {
    console.warn('⚠️  WARNING: WEBHOOK_URL is set but NODE_ENV is not production');
    console.warn('   Bot will use polling mode. For production, set NODE_ENV=production');
  }
  
  bot.launch().then(() => {
    console.log('✅ Bot started in polling mode');
  }).catch((err) => {
    console.error('❌ Ошибка запуска бота:', err);
    process.exit(1);
  });
  
  // Graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
```

### 4. Предотвращение 409 конфликтов

**Проблема**: Если несколько инстансов бота запущены одновременно, Telegram возвращает 409 Conflict.

**Решение**:
1. ✅ Используйте **только webhook режим** в production
2. ✅ Убедитесь, что запущен **только один инстанс** сервиса на Railway
3. ✅ Отключите auto-deploy при каждом push (или используйте manual deploy)
4. ✅ При обновлении бота: сначала остановите старый инстанс, затем запустите новый

### 5. Health Check

Railway должен проверять доступность бота через health check endpoint:

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    mode: isProduction ? 'webhook' : 'polling',
    webhookUrl: webhookUrl || 'not set'
  });
});
```

В Railway настройках:
- **Health Check Path**: `/health`
- **Health Check Interval**: 30 seconds

### 6. Проверка webhook

После деплоя проверьте, что webhook установлен:

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

Должен вернуть:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-railway-app.railway.app/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Интеграция с Frontend

Frontend использует прокси через Next.js API route:

- `POST /api/telegram/link-session` - связывает сессию пользователя с Telegram
- `GET /api/telegram/session-status/[token]` - проверяет статус сессии

Эти endpoints проксируют запросы к Railway боту через `TELEGRAM_API_URL`.

## Troubleshooting

### 409 Conflict Error

**Причина**: Несколько инстансов бота пытаются обработать одно обновление.

**Решение**:
1. Проверьте, что запущен только один инстанс на Railway
2. Убедитесь, что используется webhook, а не polling
3. Перезапустите сервис на Railway

### Webhook не устанавливается

**Причина**: Неверный URL или проблемы с SSL.

**Решение**:
1. Проверьте, что `WEBHOOK_URL` указывает на правильный endpoint
2. Убедитесь, что Railway сервис доступен по HTTPS
3. Проверьте логи Railway на наличие ошибок

### Бот не отвечает

**Причина**: Webhook не настроен или бот не запущен.

**Решение**:
1. Проверьте логи Railway
2. Убедитесь, что webhook установлен через `getWebhookInfo`
3. Проверьте, что endpoint `/telegram/webhook` доступен

## Мониторинг

Рекомендуется настроить мониторинг:
- Railway метрики (CPU, Memory, Requests)
- Логи бота (Railway Logs)
- Telegram Bot API статус

## Безопасность

1. ✅ Никогда не коммитьте `TELEGRAM_BOT_TOKEN` в репозиторий
2. ✅ Используйте Railway Secrets для хранения токенов
3. ✅ Ограничьте доступ к webhook endpoint (опционально, через middleware)
4. ✅ Валидируйте входящие запросы от Telegram (проверка подписи)


# Промпт для настройки Telegram бота на Railway

## Задача

Нужно настроить Telegram бота на Railway, который будет работать с системой регистрации WELLIFY business. Бот должен принимать данные от пользователя через Telegram и сохранять их в Supabase.

## Архитектура

1. **Next.js приложение** (Vercel) вызывает бота через API route `/api/telegram/create-session`
2. **API route** проксирует запрос на **Railway бот** по URL: `https://wellify-support-bot-dev.up.railway.app/telegram/create-session`
3. **Бот на Railway** создает сессию регистрации, возвращает токен и ссылку на Telegram
4. Пользователь сканирует QR код, открывает бота в Telegram, вводит номер телефона
5. Бот сохраняет данные в Supabase и обновляет статус сессии
6. Next.js приложение проверяет статус через polling

---

## Требования к боту

### 1. Эндпоинт: `POST /telegram/create-session`

**URL:** `https://your-bot-url.up.railway.app/telegram/create-session`

**Запрос (Request Body):**
```json
{
  "userId": "uuid-пользователя-из-supabase",
  "email": "user@example.com",
  "language": "ru" // или "uk", "en"
}
```

**Ответ (Response) - Успех (200):**
```json
{
  "sessionToken": "uuid-токен-сессии",
  "telegramLink": "https://t.me/your_bot?start=session_token_here"
}
```

**Ответ (Response) - Ошибка (400/500):**
```json
{
  "error": "Описание ошибки",
  "details": "Детали ошибки (опционально)"
}
```

**Что должен делать бот:**
1. Принять `userId`, `email`, `language`
2. Создать запись в таблице `registration_sessions` в Supabase:
   - `id` = новый UUID (это будет `sessionToken`)
   - `user_id` = `userId` из запроса
   - `email` = `email` из запроса
   - `language` = `language` из запроса
   - `status` = `'pending'`
   - `created_at` = текущее время
   - `expires_at` = текущее время + 30 минут (или другое время жизни)
3. Сгенерировать `telegramLink` в формате: `https://t.me/YOUR_BOT_USERNAME?start={sessionToken}`
4. Вернуть `sessionToken` и `telegramLink`

---

### 2. Эндпоинт: `GET /telegram/session-status/{sessionToken}`

**URL:** `https://your-bot-url.up.railway.app/telegram/session-status/{sessionToken}`

**Метод:** `GET`

**Параметры URL:**
- `{sessionToken}` - UUID токен сессии (из пути URL)

**Ответ (Response) - Успех (200):**
```json
{
  "status": "pending" | "completed" | "expired",
  "phone": "380501234567" | null,
  "phoneVerified": true | false,
  "telegramVerified": true | false
}
```

**Ответ (Response) - Ошибка (404/500):**
```json
{
  "error": "Описание ошибки"
}
```

**Что должен делать бот:**
1. Извлечь `sessionToken` из URL пути
2. Найти сессию по `sessionToken` в таблице `registration_sessions`
3. Проверить, не истекла ли сессия (`expires_at > now()`)
4. Если сессия истекла, вернуть `status: "expired"`
5. Вернуть текущий статус сессии:
   - `status` - текущий статус из БД
   - `phone` - номер телефона (если есть)
   - `phoneVerified` - `true` если `phone` не null
   - `telegramVerified` - `true` если `status === "completed"`

---

### 3. Обработка команды `/start` в Telegram боте

Когда пользователь открывает бота по ссылке `https://t.me/YOUR_BOT_USERNAME?start={sessionToken}`:

1. Бот получает `sessionToken` из параметра `/start`
2. Бот проверяет сессию в Supabase:
   - Существует ли сессия
   - Не истекла ли она (`expires_at > now()`)
   - Статус = `'pending'`
3. Если все ОК, бот просит пользователя ввести номер телефона
4. После получения номера телефона:
   - Сохранить номер в таблицу `registration_sessions` (поле `phone`)
   - Обновить профиль пользователя в таблице `profiles`:
     - `phone` = номер телефона
     - `telegram_id` = `telegram_user_id` из Telegram
     - `telegram_username` = `telegram_username` (если есть)
     - `telegram_first_name` = `telegram_first_name`
     - `telegram_last_name` = `telegram_last_name` (если есть)
     - `telegram_verified` = `true`
   - Обновить статус сессии: `status` = `'completed'`, `completed_at` = текущее время
5. Отправить пользователю сообщение об успешной регистрации

---

## Переменные окружения на Railway

Бот должен иметь следующие переменные окружения:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
TELEGRAM_BOT_USERNAME=@your_bot_username
SUPPORT_MANAGERS_CHAT_ID=-1001234567890

# App
APP_BASE_URL=https://dev.wellifyglobal.com
NODE_ENV=production
```

---

## Структура таблицы `registration_sessions` в Supabase

```sql
CREATE TABLE IF NOT EXISTS public.registration_sessions (
  id           uuid primary key default gen_random_uuid(),   -- SESSION_TOKEN
  user_id      uuid not null references auth.users(id) on delete cascade,
  email        text not null,
  language     text default 'ru',
  status       text not null default 'pending',              -- 'pending' | 'completed' | 'expired' | 'cancelled'
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  completed_at timestamptz,
  telegram_id  text,
  phone        text
);
```

---

## Структура таблицы `profiles` в Supabase

Бот должен обновлять следующие поля в таблице `profiles`:

```sql
-- Поля, которые нужно обновить:
phone                  text,
telegram_id            text,
telegram_username      text,
telegram_first_name    text,
telegram_last_name     text,
telegram_verified      boolean default false
```

---

## Пример кода для создания сессии (Node.js/TypeScript)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /telegram/create-session
async function createSession(req: { userId: string; email: string; language: string }) {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 минут жизни
  
  const { data, error } = await supabase
    .from('registration_sessions')
    .insert({
      id: sessionToken,
      user_id: req.userId,
      email: req.email,
      language: req.language || 'ru',
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }
  
  const telegramLink = `https://t.me/${process.env.TELEGRAM_BOT_USERNAME?.replace('@', '')}?start=${sessionToken}`;
  
  return {
    sessionToken,
    telegramLink,
  };
}
```

---

## Пример кода для обработки /start команды (Node.js/TypeScript)

```typescript
// Обработка команды /start в Telegram боте
bot.onText(/\/start (.+)/, async (msg, match) => {
  const sessionToken = match[1];
  const chatId = msg.chat.id;
  const telegramUserId = msg.from?.id.toString();
  const telegramUsername = msg.from?.username;
  const telegramFirstName = msg.from?.first_name;
  const telegramLastName = msg.from?.last_name;
  
  // Проверяем сессию
  const { data: session, error } = await supabase
    .from('registration_sessions')
    .select('*')
    .eq('id', sessionToken)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error || !session) {
    bot.sendMessage(chatId, 'Сессия не найдена или истекла. Пожалуйста, начните регистрацию заново.');
    return;
  }
  
  // Просим ввести номер телефона
  bot.sendMessage(chatId, 'Пожалуйста, отправьте ваш номер телефона в формате: +380501234567');
  
  // Сохраняем sessionToken в контексте пользователя для следующего сообщения
  // (используйте Map или базу данных для хранения состояния)
  userSessions.set(chatId, sessionToken);
});

// Обработка номера телефона
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const sessionToken = userSessions.get(chatId);
  
  if (!sessionToken) return; // Не обрабатываем, если нет активной сессии
  
  const phone = msg.text?.trim();
  
  // Валидация номера телефона
  if (!phone || !/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ''))) {
    bot.sendMessage(chatId, 'Неверный формат номера телефона. Пожалуйста, отправьте номер в формате: +380501234567');
    return;
  }
  
  // Получаем сессию
  const { data: session } = await supabase
    .from('registration_sessions')
    .select('*')
    .eq('id', sessionToken)
    .single();
  
  if (!session) {
    bot.sendMessage(chatId, 'Сессия не найдена.');
    return;
  }
  
  // Обновляем сессию
  await supabase
    .from('registration_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      phone: phone,
      telegram_id: msg.from?.id.toString(),
    })
    .eq('id', sessionToken);
  
  // Обновляем профиль пользователя
  await supabase
    .from('profiles')
    .update({
      phone: phone,
      telegram_id: msg.from?.id.toString(),
      telegram_username: msg.from?.username,
      telegram_first_name: msg.from?.first_name,
      telegram_last_name: msg.from?.last_name,
      telegram_verified: true,
    })
    .eq('id', session.user_id);
  
  bot.sendMessage(chatId, '✅ Регистрация завершена! Ваш номер телефона подтвержден.');
  
  // Очищаем сессию из контекста
  userSessions.delete(chatId);
});
```

---

## Пример кода для проверки статуса сессии

```typescript
// GET /telegram/session-status/{sessionToken}
async function getSessionStatus(sessionToken: string) {
  const { data: session, error } = await supabase
    .from('registration_sessions')
    .select('*')
    .eq('id', sessionToken)
    .single();
  
  if (error || !session) {
    return { status: 'expired', phone: null, phoneVerified: false, telegramVerified: false };
  }
  
  // Проверяем, не истекла ли сессия
  if (new Date(session.expires_at) < new Date()) {
    return { status: 'expired', phone: session.phone, phoneVerified: false, telegramVerified: false };
  }
  
  return {
    status: session.status,
    phone: session.phone,
    phoneVerified: !!session.phone,
    telegramVerified: session.status === 'completed',
  };
}
```

---

## Важные моменты

1. **Безопасность:**
   - Используйте `SUPABASE_SERVICE_ROLE_KEY` для доступа к базе данных (не anon key)
   - Валидируйте все входные данные
   - Проверяйте срок действия сессий

2. **Обработка ошибок:**
   - Всегда возвращайте понятные сообщения об ошибках
   - Логируйте ошибки для отладки

3. **Таймауты:**
   - Сессии должны иметь срок действия (например, 30 минут)
   - Автоматически помечайте истекшие сессии как `'expired'`

4. **Тестирование:**
   - Протестируйте все эндпоинты
   - Убедитесь, что бот корректно обрабатывает команды
   - Проверьте интеграцию с Supabase

---

## Чеклист для проверки

- [ ] Эндпоинт `POST /telegram/create-session` работает
- [ ] Эндпоинт `GET /telegram/session-status/{token}` работает
- [ ] Бот обрабатывает команду `/start {token}`
- [ ] Бот принимает номер телефона
- [ ] Данные сохраняются в `registration_sessions`
- [ ] Профиль пользователя обновляется в `profiles`
- [ ] Статус сессии меняется на `completed`
- [ ] Все переменные окружения настроены
- [ ] Бот доступен по публичному URL на Railway
- [ ] Логирование работает для отладки

---

## Дополнительная информация

Если нужна помощь с конкретной реализацией, укажите:
- Какой фреймворк использует бот (Node.js, Python, etc.)
- Какая библиотека для Telegram (node-telegram-bot-api, telegraf, etc.)
- Структура проекта бота


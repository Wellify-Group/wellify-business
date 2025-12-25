# Промпт для исправления Telegram бота

## Проблема

При регистрации пользователя через Telegram бота возникает ошибка:
**"Ссылка для регистрации не найдена или больше не актуальна. Пожалуйста, вернитесь в браузер и отсканируйте QR код заново."**

Это происходит, когда пользователь переходит по ссылке из QR-кода (команда `/start TOKEN`).

## Анализ проблемы

1. **Фронтенд (Vercel)** создает сессию через API:
   - Запрос: `POST https://wellify-support-bot-production.up.railway.app/telegram/create-session`
   - Тело: `{ userId, email, language }`
   - Ответ должен содержать: `{ sessionToken, telegramLink }`
   - `telegramLink` имеет формат: `https://t.me/@wellifybusinesssupport_bot?start=TOKEN`

2. **Бот получает команду** `/start TOKEN` от пользователя

3. **Бот должен найти сессию** в БД по токену из команды `/start`

4. **Проблема**: Бот не может найти сессию в БД, хотя она была создана

## Что нужно проверить и исправить

### 1. Проверка создания сессии

**Проверьте эндпоинт `/telegram/create-session` (или `/api/telegram/create-session`):**

- ✅ Принимает ли он запрос с телом `{ userId, email, language }`
- ✅ Создает ли он запись в таблице сессий в Supabase
- ✅ Генерирует ли он уникальный `sessionToken`
- ✅ Возвращает ли он `telegramLink` в формате `https://t.me/@wellifybusinesssupport_bot?start=TOKEN`
- ✅ Токен в ссылке должен совпадать с `sessionToken` в БД

**Логирование для отладки:**
```javascript
console.log('[create-session] Request received:', { userId, email, language });
console.log('[create-session] Generated sessionToken:', sessionToken);
console.log('[create-session] Created telegramLink:', telegramLink);
console.log('[create-session] Session saved to DB:', { sessionToken, userId, email });
```

### 2. Проверка обработки команды /start

**Проверьте обработчик команды `/start`:**

- ✅ Извлекает ли он токен из команды: `/start TOKEN` → `TOKEN`
- ✅ Ищет ли он сессию в БД по токену
- ✅ Использует ли он правильное имя таблицы (например, `telegram_registration_sessions` или `registration_sessions`)
- ✅ Правильно ли формируется SQL-запрос для поиска

**Пример правильного кода:**
```javascript
// Извлечение токена из команды /start
const token = ctx.message.text.split(' ')[1]; // /start TOKEN → TOKEN

if (!token) {
  return ctx.reply('Ссылка для регистрации не найдена или больше не актуальна. Пожалуйста, вернитесь в браузер и отсканируйте QR код заново.');
}

// Поиск сессии в БД
const { data: session, error } = await supabase
  .from('telegram_registration_sessions') // или другое имя таблицы
  .select('*')
  .eq('session_token', token)
  .eq('status', 'pending') // или 'active'
  .single();

if (error || !session) {
  console.error('[bot] Session not found:', { token, error });
  return ctx.reply('Ссылка для регистрации не найдена или больше не актуальна. Пожалуйста, вернитесь в браузер и отсканируйте QR код заново.');
}

// Продолжить обработку сессии...
```

### 3. Проверка структуры таблицы в БД

**Убедитесь, что таблица сессий существует и имеет правильную структуру:**

```sql
-- Пример структуры таблицы
CREATE TABLE IF NOT EXISTS telegram_registration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  language TEXT DEFAULT 'ru',
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed', 'expired'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  telegram_verified BOOLEAN DEFAULT FALSE
);

-- Индекс для быстрого поиска по токену
CREATE INDEX IF NOT EXISTS idx_session_token ON telegram_registration_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_id ON telegram_registration_sessions(user_id);
```

### 4. Проверка соответствия токенов

**КРИТИЧЕСКИ ВАЖНО:** Токен в ссылке `telegramLink` должен **ТОЧНО** совпадать с `session_token` в БД.

**Проверьте:**
- Нет ли лишних пробелов или символов
- Правильно ли извлекается токен из команды `/start`
- Используется ли правильное поле для поиска в БД

**Логирование для отладки:**
```javascript
console.log('[bot] /start command received:', ctx.message.text);
console.log('[bot] Extracted token:', token);
console.log('[bot] Searching for session with token:', token);
console.log('[bot] Session found:', session ? 'YES' : 'NO');
if (session) {
  console.log('[bot] Session details:', { 
    id: session.id, 
    token: session.session_token, 
    userId: session.user_id,
    status: session.status 
  });
}
```

### 5. Проверка времени жизни сессии

**Убедитесь, что сессия не истекает слишком быстро:**

- Проверьте поле `expires_at` в таблице
- Убедитесь, что при создании сессии устанавливается разумное время истечения (например, 30 минут)
- При поиске сессии проверяйте, не истекла ли она

**Пример:**
```javascript
// При создании сессии
const expiresAt = new Date();
expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 минут

// При поиске сессии
const { data: session } = await supabase
  .from('telegram_registration_sessions')
  .select('*')
  .eq('session_token', token)
  .eq('status', 'pending')
  .gt('expires_at', new Date().toISOString()) // Проверка истечения
  .single();
```

## Конкретные шаги для исправления

1. **Добавьте детальное логирование** в оба места:
   - При создании сессии (`/telegram/create-session`)
   - При обработке команды `/start`

2. **Проверьте имя таблицы** в БД - убедитесь, что оно совпадает в обоих местах

3. **Проверьте извлечение токена** из команды `/start` - убедитесь, что токен извлекается правильно

4. **Проверьте SQL-запрос** для поиска сессии - убедитесь, что он ищет по правильному полю

5. **Проверьте логи Railway** при реальной регистрации - посмотрите, что происходит на каждом шаге

## Тестирование

После исправления протестируйте:

1. Создайте сессию через фронтенд
2. Проверьте логи - сессия должна быть создана в БД
3. Скопируйте токен из ссылки
4. Отправьте боту команду `/start TOKEN`
5. Проверьте логи - сессия должна быть найдена
6. Бот должен продолжить процесс регистрации

## Дополнительная информация

- **Supabase URL**: `https://sdkdzphjtrajjmylakma.supabase.co`
- **Таблица сессий**: Проверьте точное имя таблицы в вашей БД
- **Формат токена**: Убедитесь, что токен генерируется правильно и сохраняется в БД

---

**Если проблема не решается**, проверьте:
1. Логи Railway при создании сессии
2. Логи Railway при обработке `/start`
3. Данные в таблице сессий в Supabase
4. Соответствие токенов между ссылкой и БД


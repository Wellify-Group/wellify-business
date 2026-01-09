# 🔄 MIGRATION GUIDE - Сохранить Frontend, Заменить Backend

## Для Cursor AI

**Задача:** Сохранить существующий фронтенд (UI/UX), заменить всю инфраструктуру на Cloudflare + Render + PostgreSQL

---

## 📁 СТРУКТУРА ПРОЕКТА

После миграции проект будет выглядеть так:

```
wellify-business/
├── 📁 frontend/                    # ТВОЙ СУЩЕСТВУЮЩИЙ ФРОНТ (НЕ ТРОГАТЬ UI)
│   ├── app/                        # Все страницы как сейчас
│   ├── components/                 # Все компоненты как сейчас
│   ├── public/                     # Все ассеты как сейчас
│   ├── styles/                     # Все стили как сейчас
│   ├── .env.local                  # ИЗМЕНИТЬ (новые переменные)
│   ├── next.config.js              # ИЗМЕНИТЬ (убрать Vercel)
│   └── package.json                # ИЗМЕНИТЬ (убрать Supabase)
│
├── 📁 backend/                     # СОЗДАТЬ ЗАНОВО
│   ├── src/
│   │   ├── index.js                # Express сервер
│   │   ├── db/
│   │   │   ├── connection.js       # PostgreSQL подключение
│   │   │   └── schema.sql          # Схема БД
│   │   ├── routes/
│   │   │   ├── auth.js             # Регистрация/логин
│   │   │   ├── users.js            # Профиль пользователя
│   │   │   ├── payments.js         # Stripe платежи
│   │   │   └── webhooks.js         # Webhooks (Stripe, Telegram)
│   │   ├── services/
│   │   │   ├── emailService.js     # Resend email
│   │   │   ├── smsService.js       # Twilio SMS (опционально)
│   │   │   └── telegramService.js  # Telegram bot
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT проверка
│   │   │   └── rateLimit.js        # Rate limiting
│   │   └── config/
│   │       └── stripe.js           # Stripe конфиг
│   ├── render.yaml                 # Render деплой конфиг
│   └── package.json
│
├── 📁 deployment-docs/             # ПАПКА С ГАЙДАМИ (положи сюда файлы)
│   ├── README.md
│   ├── MASTER_INDEX.md
│   ├── COMPLETE_DEPLOYMENT_GUIDE_FULL.md
│   └── MIGRATION_GUIDE_CURSOR.md  # Этот файл
│
└── 📁 cloudflare/                  # СОЗДАТЬ (если будем использовать Workers)
    └── wrangler.toml
```

---

## 🎯 ПОШАГОВЫЙ ПЛАН МИГРАЦИИ

### ШАГ 1: ПОДГОТОВКА (5 минут)

**1.1. Создай папку для документации**
```bash
mkdir deployment-docs
```

**1.2. Положи туда все файлы гайда:**
- `README.md`
- `MASTER_INDEX.md`
- `COMPLETE_DEPLOYMENT_GUIDE_FULL.md`
- `MIGRATION_GUIDE_CURSOR.md` (этот файл)

**1.3. Прочитай COMPLETE_DEPLOYMENT_GUIDE_FULL.md**
Это твоя главная инструкция. В ней ВСЁ.

---

### ШАГ 2: АНАЛИЗ ТЕКУЩЕГО ФРОНТА (10 минут)

**2.1. Найди все API вызовы**

Ищи в коде:
```javascript
// Supabase клиент
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(...)

// Возможные вызовы
supabase.auth.signUp()
supabase.auth.signIn()
supabase.from('table').select()
supabase.from('table').insert()
```

**2.2. Составь список всех API методов**

Пример:
- ✅ Регистрация пользователя
- ✅ Вход пользователя
- ✅ Получить профиль
- ✅ Обновить профиль
- ✅ Сменить пароль
- ✅ Восстановить пароль
- ✅ Верификация email
- ✅ И т.д.

**2.3. Найди все переменные окружения**

Ищи в `.env.local` или `next.config.js`:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_VERCEL_URL=...
```

---

### ШАГ 3: СОЗДАТЬ BACKEND (30 минут)

**3.1. Следуй PART 3 из COMPLETE_DEPLOYMENT_GUIDE_FULL.md**

Создай структуру backend:
```bash
mkdir backend
cd backend
npm init -y
npm install express pg bcrypt jsonwebtoken cors helmet dotenv
```

**3.2. Создай Express сервер с ВСЕМИ методами из списка в Шаге 2.2**

Пример структуры:

`backend/src/index.js`:
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import paymentRoutes from './routes/payments.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health/live', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

`backend/src/routes/auth.js`:
```javascript
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Проверка существования
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Хеш пароля
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Создать пользователя
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name]
    );
    
    const user = result.rows[0];
    
    // Создать JWT токен
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Найти пользователя
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Проверить пароль
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Создать JWT токен
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
```

**3.3. Создай ВСЕ остальные эндпоинты аналогично**

Для каждого метода из списка Шага 2.2.

---

### ШАГ 4: DEPLOY BACKEND НА RENDER (20 минут)

**4.1. Следуй PART 3 полностью**

Все команды из гайда:
```bash
# Создать render.yaml
# Установить Render CLI
# Логин в Render
render login

# Deploy
cd backend
render blueprint launch render.yaml
```

**4.2. Получи URL бэкенда**

Например: `https://wellify-business-backend.onrender.com`

---

### ШАГ 5: ОБНОВИТЬ FRONTEND (15 минут)

**5.1. Создать API клиент**

`frontend/lib/api.js`:
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiClient {
  constructor() {
    this.token = null;
  }
  
  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }
  
  getToken() {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }
  
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  }
  
  // Auth methods
  async register(email, password, name) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(data.token);
    return data;
  }
  
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }
  
  async logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }
  
  // User methods
  async getProfile() {
    return this.request('/api/users/me');
  }
  
  async updateProfile(data) {
    return this.request('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  // Add more methods for each API endpoint...
}

export const api = new ApiClient();
```

**5.2. Заменить все Supabase вызовы**

Найди все места в коде где:
```javascript
// СТАРОЕ (Supabase)
const { data, error } = await supabase.auth.signUp({ email, password });

// НОВОЕ (твой API)
const data = await api.register(email, password, name);
```

**5.3. Обновить переменные окружения**

`frontend/.env.local`:
```env
# Удалить все Supabase/Vercel переменные
# Добавить новые:
NEXT_PUBLIC_API_URL=https://wellify-business-backend.onrender.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**5.4. Обновить package.json**

Удали Supabase зависимости:
```bash
npm uninstall @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

### ШАГ 6: DEPLOY FRONTEND НА CLOUDFLARE (15 минут)

**6.1. Следуй PART 2 из COMPLETE_DEPLOYMENT_GUIDE_FULL.md**

```bash
# Установить Wrangler
npm install -g wrangler

# Логин
npx wrangler login

# Build
cd frontend
npm run build

# Deploy
npx wrangler pages deploy .next --project-name=wellify-business
```

**6.2. Получи URL фронтенда**

Например: `https://wellify-business.pages.dev`

---

### ШАГ 7: ПОДКЛЮЧИТЬ ИНТЕГРАЦИИ (30 минут)

**7.1. Email (Resend)**

Следуй PART 4 из гайда для настройки email.

**7.2. Payments (Stripe)**

Следуй PART 4 для настройки платежей.

**7.3. Telegram Bot**

Следуй PART 5 для бота поддержки.

**7.4. SMS (опционально)**

Следуй PART 5 для SMS верификации.

---

### ШАГ 8: ТЕСТИРОВАНИЕ (20 минут)

**8.1. Тест регистрации**
```bash
curl -X POST https://wellify-business-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","name":"Test User"}'
```

**8.2. Тест логина**
```bash
curl -X POST https://wellify-business-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

**8.3. Тест фронтенда**
- Открой `https://wellify-business.pages.dev`
- Попробуй зарегистрироваться
- Попробуй войти
- Проверь все страницы

---

## ⚠️ ВАЖНЫЕ ПРАВИЛА

### ЧТО НЕ ТРОГАТЬ:
- ❌ `frontend/app/` - страницы (только обнови API вызовы)
- ❌ `frontend/components/` - компоненты UI (только обнови логику)
- ❌ `frontend/public/` - ассеты
- ❌ `frontend/styles/` - стили

### ЧТО ИЗМЕНИТЬ:
- ✅ Все Supabase вызовы → новый API клиент
- ✅ `.env.local` → новые переменные
- ✅ `package.json` → удалить Supabase
- ✅ Authentication логика → JWT вместо Supabase Auth

### ЧТО СОЗДАТЬ:
- ✅ Всю папку `backend/`
- ✅ API клиент `frontend/lib/api.js`
- ✅ Все эндпоинты бэкенда

---

## 📝 ЧЕКЛИСТ МИГРАЦИИ

**Подготовка:**
- [ ] Создана папка `deployment-docs/`
- [ ] Скопированы все гайды
- [ ] Прочитан COMPLETE_DEPLOYMENT_GUIDE_FULL.md
- [ ] Составлен список всех API методов

**Backend:**
- [ ] Создана структура `backend/`
- [ ] Установлены зависимости
- [ ] Создан Express сервер
- [ ] Созданы все роуты (auth, users, payments, etc.)
- [ ] Создана PostgreSQL схема
- [ ] Настроены все сервисы (email, SMS, Telegram)
- [ ] Создан `render.yaml`
- [ ] Backend задеплоен на Render
- [ ] Health check работает

**Frontend:**
- [ ] Создан API клиент
- [ ] Заменены все Supabase вызовы
- [ ] Обновлены переменные окружения
- [ ] Удалены Supabase зависимости
- [ ] Frontend собран без ошибок
- [ ] Frontend задеплоен на Cloudflare Pages
- [ ] Фронт открывается в браузере

**Интеграции:**
- [ ] Email через Resend работает
- [ ] Stripe платежи работают
- [ ] Telegram bot отвечает
- [ ] SMS верификация работает (если нужна)

**Тестирование:**
- [ ] Регистрация работает
- [ ] Логин работает
- [ ] Получение профиля работает
- [ ] Обновление профиля работает
- [ ] Email приходит
- [ ] Платежи проходят
- [ ] Все страницы открываются

---

## 🚨 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

**Backend не запускается:**
- Проверь PART 7 в COMPLETE_DEPLOYMENT_GUIDE_FULL.md
- Посмотри логи: `render logs wellify-business-backend`
- Проверь переменные окружения

**Frontend не подключается к Backend:**
- Проверь CORS настройки в backend
- Проверь `NEXT_PUBLIC_API_URL` в frontend
- Проверь что backend URL правильный

**База данных не работает:**
- Проверь `DATABASE_URL` в Render
- Проверь что миграции выполнены
- Проверь логи PostgreSQL

---

## 💡 СОВЕТЫ

1. **Не спеши** - делай по шагам, проверяй каждый шаг
2. **Читай гайд** - все ответы в COMPLETE_DEPLOYMENT_GUIDE_FULL.md
3. **Тестируй часто** - проверяй после каждого шага
4. **Сохраняй URLs** - записывай все URLs и ID
5. **Делай бэкапы** - коммить после каждого успешного шага

---

## 📊 ВРЕМЯ НА МИГРАЦИЮ

- Анализ текущего кода: 10 мин
- Создание backend: 30 мин
- Deploy backend: 20 мин
- Обновление frontend: 15 мин
- Deploy frontend: 15 мин
- Подключение интеграций: 30 мин
- Тестирование: 20 мин

**Итого: ~2.5 часа**

---

## ✅ ФИНАЛЬНАЯ ПРОВЕРКА

После миграции у тебя должно быть:

- ✅ Frontend на Cloudflare Pages с тем же UI
- ✅ Backend на Render.com с PostgreSQL
- ✅ Все API методы работают
- ✅ Email через Resend
- ✅ Платежи через Stripe
- ✅ Telegram bot
- ✅ Никаких следов Supabase или Vercel

**Поздравляю! Миграция завершена! 🎉**

---

## 📞 ЕСЛИ НУЖНА ПОМОЩЬ

1. Перечитай PART 7 (Troubleshooting)
2. Проверь логи сервисов
3. Проверь переменные окружения
4. Проверь что все команды выполнены

**99% проблем решаются перечитыванием гайда и проверкой логов**

---

Название папки: `deployment-docs` или `_deployment-guides`
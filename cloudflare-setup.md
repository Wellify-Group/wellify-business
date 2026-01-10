# Инструкция по настройке Cloudflare D1 и R2

## Обзор

Этот проект использует:
- **Frontend**: Vercel ✅
- **Backend**: Render ✅
- **База данных**: Cloudflare D1 (SQLite)
- **Файлы**: Cloudflare R2 (S3-совместимое хранилище)

## 1. Настройка Cloudflare D1

### 1.1 Создание D1 базы данных

1. Войдите в [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Выберите ваш аккаунт
3. Перейдите в **Workers & Pages** → **D1**
4. Нажмите **Create database**
5. Укажите имя базы данных: `wellify-business-db`
6. Выберите регион (рекомендуется: ближайший к вашему backend)
7. Нажмите **Create**

### 1.2 Получение credentials

После создания базы данных вам понадобятся:

1. **Account ID**: 
   - Находится в правом верхнем углу Cloudflare Dashboard
   - Или в URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/`

2. **Database ID**:
   - После создания базы, откройте её
   - Database ID виден в URL или в настройках базы

3. **API Token**:
   - Перейдите в **My Profile** → **API Tokens**
   - Нажмите **Create Token**
   - Используйте шаблон **Edit Cloudflare Workers** или создайте кастомный:
     - Permissions: `Account.Cloudflare D1.Edit`
     - Account Resources: `Include - All accounts`
   - Скопируйте токен (он показывается только один раз!)

### 1.3 Применение схемы базы данных

#### Вариант 1: Через Cloudflare Dashboard (рекомендуется)

1. Откройте вашу D1 базу данных
2. Перейдите во вкладку **Console**
3. Скопируйте содержимое `backend/src/db/schema-d1.sql`
4. Вставьте в консоль и выполните

#### Вариант 2: Через Wrangler CLI

```bash
# Установите Wrangler CLI
npm install -g wrangler

# Авторизуйтесь
wrangler login

# Создайте wrangler.toml в корне backend/ (если ещё нет)
```

`backend/wrangler.toml`:
```toml
name = "wellify-business-backend"
main = "src/server.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "wellify-business-db"
database_id = "YOUR_DATABASE_ID"

# Для local development
[[env.development.d1_databases]]
binding = "DB"
database_name = "wellify-business-db"
database_id = "YOUR_DATABASE_ID"
```

Применить схему:
```bash
cd backend
wrangler d1 execute wellify-business-db --file=src/db/schema-d1.sql
```

### 1.4 Environment Variables для Render

Добавьте следующие переменные окружения в Render Dashboard для вашего backend service:

```
DATABASE_TYPE=d1
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_D1_DATABASE_ID=your_database_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
```

**Важно**: 
- `DATABASE_TYPE` должен быть установлен в `d1` для использования D1
- Для использования PostgreSQL (Render) установите `DATABASE_TYPE=postgres` (или не указывайте)
- `DATABASE_URL` всё ещё нужен для PostgreSQL, но не используется при `DATABASE_TYPE=d1`

## 2. Настройка Cloudflare R2

### 2.1 Создание R2 Bucket

1. В Cloudflare Dashboard перейдите в **R2**
2. Нажмите **Create bucket**
3. Укажите имя bucket: `wellify-business-files`
4. Выберите Location (рекомендуется: ближайший к вашему backend)
5. Нажмите **Create bucket**

### 2.2 Настройка публичного доступа (опционально)

Если нужно предоставлять публичный доступ к файлам:

1. Откройте ваш bucket
2. Перейдите в **Settings** → **Public Access**
3. Включите **Public Access**
4. Запишите **Public Bucket URL** (например: `https://pub-ACCOUNT_ID.r2.dev`)

### 2.3 Создание API Token для R2

1. В Cloudflare Dashboard перейдите в **R2**
2. Откройте ваш bucket
3. Перейдите в **Settings** → **R2 API Tokens**
4. Нажмите **Create API token**
5. Настройки:
   - **Permissions**: `Object Read & Write`
   - **TTL**: по необходимости (или оставьте пустым для бессрочного)
   - **Access control**: выберите ваш bucket
6. Скопируйте **Access Key ID** и **Secret Access Key** (показываются только один раз!)

### 2.4 Environment Variables для Render

Добавьте следующие переменные окружения в Render Dashboard:

```
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_BUCKET_NAME=wellify-business-files
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
```

**Важно**: 
- `CLOUDFLARE_ACCOUNT_ID` используется и для D1, и для R2
- Если вы используете публичный доступ, добавьте переменную:
  ```
  CLOUDFLARE_R2_PUBLIC_URL=https://pub-ACCOUNT_ID.r2.dev
  ```

## 3. Установка зависимостей

В `backend/` директории выполните:

```bash
npm install
```

Это установит необходимые пакеты, включая:
- `@aws-sdk/client-s3` - для работы с R2

## 4. Использование в коде

### 4.1 База данных (D1 или PostgreSQL)

Backend автоматически определит какой тип БД использовать на основе `DATABASE_TYPE`:

```javascript
import { db } from './db/connection.js';

// Использование одинаково для обеих БД
const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
```

**Важно**: 
- D1 использует HTTP API, что медленнее чем прямое подключение
- Для production рекомендуется использовать D1 напрямую через Cloudflare Workers
- Параметризованные запросы (`$1`, `$2`) работают в обеих БД

### 4.2 Файловое хранилище (R2)

```javascript
import { getStorageService } from './services/storage.js';

const storage = getStorageService();

// Загрузить файл
const result = await storage.uploadFile(
  'avatars/user123.jpg', // путь в bucket
  fileBuffer, // Buffer с содержимым файла
  'image/jpeg', // MIME тип
  { userId: '123' } // опциональные метаданные
);

// Получить публичный URL
const publicUrl = result.publicUrl;

// Получить файл
const fileBuffer = await storage.getFile('avatars/user123.jpg');

// Удалить файл
await storage.deleteFile('avatars/user123.jpg');

// Получить временный подписанный URL (для приватных файлов)
const signedUrl = await storage.getSignedUrl('avatars/user123.jpg', 3600); // 1 час
```

## 5. Миграция с PostgreSQL на D1

### 5.1 Экспорт данных из PostgreSQL

```bash
# На Render выполните:
pg_dump $DATABASE_URL > backup.sql
```

### 5.2 Конвертация данных

Необходимо конвертировать:
- UUID → TEXT (в D1 UUID хранятся как TEXT)
- TIMESTAMPTZ → TEXT (DATETIME в SQLite)
- JSONB → TEXT (JSON в SQLite)
- BOOLEAN → INTEGER (0/1 в SQLite)

Создайте скрипт для конвертации или используйте существующие инструменты.

### 5.3 Импорт в D1

```bash
# Через Wrangler CLI
wrangler d1 execute wellify-business-db --file=migrated-data.sql
```

## 6. Проверка работы

### 6.1 Тест D1 подключения

Backend автоматически проверяет подключение при старте. Проверьте логи:

```
Database connected successfully
D1 database connected successfully
```

### 6.2 Тест R2 подключения

Создайте тестовый endpoint в backend:

```javascript
// routes/storage.js
router.post('/test', async (req, res) => {
  try {
    const storage = getStorageService();
    const result = await storage.uploadFile(
      'test/test.txt',
      Buffer.from('Hello R2!'),
      'text/plain'
    );
    res.json({ success: true, url: result.publicUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 7. Troubleshooting

### Проблема: D1 запросы медленные

**Решение**: D1 HTTP API медленнее чем прямое подключение. Для production рассмотрите миграцию на Cloudflare Workers.

### Проблема: R2 403 Forbidden

**Решение**: Проверьте что API Token имеет правильные права доступа и bucket name корректный.

### Проблема: UUID не генерируется в D1

**Решение**: Генерируйте UUID в приложении (Node.js: `crypto.randomUUID()`), так как SQLite не имеет встроенной функции UUID.

### Проблема: TIMESTAMPTZ не работает в D1

**Решение**: Используйте `datetime('now')` или `strftime('%Y-%m-%d %H:%M:%S', 'now')` в SQL, или генерируйте timestamp в приложении.

## 8. Рекомендации для Production

1. **Используйте Cloudflare Workers** для прямого доступа к D1 (быстрее HTTP API)
2. **Настройте CORS** для R2 если нужен публичный доступ
3. **Используйте CDN** для статических файлов из R2
4. **Настройте резервное копирование** D1 (через экспорт данных)
5. **Мониторьте использование** через Cloudflare Dashboard

## 9. Стоимость

### D1:
- **Free**: 5GB storage, 5M reads/day, 100K writes/day
- **Paid**: $0.001/GB storage, $0.001/1M reads, $1/1M writes

### R2:
- **Free**: 10GB storage, 1M class A operations, 10M class B operations
- **Paid**: $0.015/GB storage, $4.50/1M class A, $0.36/1M class B

Для большинства проектов бесплатного тарифа достаточно на старте.

## 10. Дополнительные ресурсы

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [D1 SQL Reference](https://developers.cloudflare.com/d1/reference/sqlite/)
- [R2 S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)

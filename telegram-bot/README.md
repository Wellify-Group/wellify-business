# WELLIFY Support Telegram Bot

Telegram-бот для поддержки WELLIFY Business.

## Настройка

1. Скопируйте `.env.example` в `.env` и заполните значения:
   ```bash
   cp .env.example .env
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

## Разработка

Запуск в режиме разработки:
```bash
npm run dev
```

## Сборка и запуск

Сборка проекта:
```bash
npm run build
```

Запуск production версии:
```bash
npm start
```

## Структура

- `src/index.ts` - основной файл бота
- `dist/` - скомпилированные файлы (генерируется при сборке)
- `.env` - переменные окружения (не коммитится)


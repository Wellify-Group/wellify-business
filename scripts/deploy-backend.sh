#!/bin/bash
# Скрипт для автоматизации деплоя backend на Render

set -e

echo "🚀 Начинаем деплой backend на Render..."

# Проверяем наличие необходимых переменных
if [ -z "$RENDER_API_KEY" ]; then
  echo "❌ Ошибка: RENDER_API_KEY не установлен"
  echo "Установите переменную: export RENDER_API_KEY=your-api-key"
  exit 1
fi

# Проверяем наличие wrangler
if ! command -v curl &> /dev/null; then
  echo "❌ Ошибка: curl не установлен"
  exit 1
fi

echo "✅ Все проверки пройдены"
echo ""
echo "📋 Следующие шаги нужно выполнить вручную:"
echo ""
echo "1. Создай PostgreSQL базу на Render:"
echo "   - Зайди на https://dashboard.render.com"
echo "   - Нажми 'New +' → 'PostgreSQL'"
echo "   - Назови: wellify-business-db"
echo "   - Сохрани Internal Database URL"
echo ""
echo "2. Выполни миграции:"
echo "   - Открой PostgreSQL в Render Dashboard"
echo "   - Перейди на вкладку 'Query'"
echo "   - Скопируй содержимое backend/src/db/schema.sql"
echo "   - Выполни SQL"
echo ""
echo "3. Создай Web Service:"
echo "   - Нажми 'New +' → 'Web Service'"
echo "   - Подключи GitHub репозиторий"
echo "   - Root Directory: backend"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo ""
echo "4. Настрой переменные окружения в Render:"
echo "   PORT=10000"
echo "   NODE_ENV=production"
echo "   FRONTEND_URL=https://wellify-business.pages.dev"
echo "   DATABASE_URL=<Internal Database URL>"
echo "   JWT_SECRET=<сгенерируй случайную строку>"
echo "   JWT_EXPIRES_IN=7d"
echo "   RESEND_API_KEY=<твой Resend API ключ>"
echo "   RESEND_FROM_EMAIL=Wellify Business <noreply@wellifyglobal.com>"
echo "   LOG_LEVEL=info"
echo ""
echo "5. Настрой переменные в Cloudflare Pages:"
echo "   NEXT_PUBLIC_API_URL=https://wellify-business-backend.onrender.com"
echo ""
echo "✅ Готово! Backend должен быть задеплоен."


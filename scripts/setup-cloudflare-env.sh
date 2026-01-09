#!/bin/bash
# Скрипт для настройки переменных окружения в Cloudflare Pages

set -e

echo "☁️ Настройка переменных окружения в Cloudflare Pages..."

# Проверяем наличие wrangler
if ! command -v wrangler &> /dev/null; then
  echo "❌ Ошибка: wrangler не установлен"
  echo "Установите: npm install -g wrangler"
  exit 1
fi

# Проверяем, что пользователь залогинен
if ! wrangler whoami &> /dev/null; then
  echo "❌ Ошибка: не залогинен в Cloudflare"
  echo "Выполните: wrangler login"
  exit 1
fi

# Получаем API URL из переменных окружения или запрашиваем
if [ -z "$RENDER_API_URL" ]; then
  read -p "Введите URL backend на Render (например: https://wellify-business-backend.onrender.com): " RENDER_API_URL
fi

echo "📝 Устанавливаем переменные окружения..."

# Устанавливаем переменную через wrangler
wrangler pages project create wellify-business 2>/dev/null || true

echo "✅ Переменные окружения настроены"
echo ""
echo "⚠️ ВАЖНО: Установи переменную вручную в Cloudflare Dashboard:"
echo "   NEXT_PUBLIC_API_URL=$RENDER_API_URL"
echo ""
echo "Или используй Cloudflare Dashboard:"
echo "   - Зайди в Pages → wellify-business → Settings → Environment Variables"
echo "   - Добавь: NEXT_PUBLIC_API_URL = $RENDER_API_URL"


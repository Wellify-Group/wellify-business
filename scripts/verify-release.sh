#!/bin/bash
# scripts/verify-release.sh
# Скрипт для верификации релиза WELLIFY Business
# Проверяет сборку, линтинг, env переменные и базовую функциональность

set -e  # Остановка при ошибке

echo "🔍 WELLIFY Business Release Verification"
echo "========================================"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Счетчики
PASSED=0
FAILED=0
WARNINGS=0

# Функция для проверки
check() {
    local name="$1"
    local command="$2"
    
    echo -n "Checking $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
        return 1
    fi
}

# Функция для предупреждения
warn() {
    local name="$1"
    local message="$2"
    
    echo -e "${YELLOW}⚠ WARNING: $name - $message${NC}"
    ((WARNINGS++))
}

# 1. Проверка Node.js и npm
echo "📦 Step 1: Environment Check"
echo "----------------------------"
check "Node.js version" "node --version"
check "npm version" "npm --version"
echo ""

# 2. Установка зависимостей
echo "📥 Step 2: Dependencies"
echo "----------------------"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
    check "Dependencies installed" "test -d node_modules"
else
    echo "node_modules exists, skipping npm ci"
fi
echo ""

# 3. Линтинг
echo "🔍 Step 3: Linting"
echo "------------------"
if npm run lint > /tmp/lint-output.log 2>&1; then
    echo -e "${GREEN}✓ Linting passed${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Linting failed${NC}"
    echo "Last 20 lines of lint output:"
    tail -20 /tmp/lint-output.log
    ((FAILED++))
fi
echo ""

# 4. Сборка
echo "🏗️  Step 4: Build"
echo "-----------------"
if npm run build > /tmp/build-output.log 2>&1; then
    echo -e "${GREEN}✓ Build passed${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Build failed${NC}"
    echo "Last 30 lines of build output:"
    tail -30 /tmp/build-output.log
    ((FAILED++))
fi
echo ""

# 5. Проверка env переменных
echo "🔐 Step 5: Environment Variables"
echo "----------------------------------"
MISSING_VARS=0

# Клиентские переменные
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    warn "NEXT_PUBLIC_SUPABASE_URL" "not set"
    ((MISSING_VARS++))
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    warn "NEXT_PUBLIC_SUPABASE_ANON_KEY" "not set"
    ((MISSING_VARS++))
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
    warn "NEXT_PUBLIC_APP_URL" "not set"
    ((MISSING_VARS++))
fi

# Серверные переменные (только предупреждения, не ошибки)
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    warn "SUPABASE_SERVICE_ROLE_KEY" "not set (required for server operations)"
fi

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    warn "TELEGRAM_BOT_TOKEN" "not set (Telegram bot will not work)"
fi

if [ -z "$RESEND_API_KEY" ]; then
    warn "RESEND_API_KEY" "not set (Email sending via Resend will not work)"
fi

if [ -z "$WEBHOOK_URL" ] && [ "$NODE_ENV" = "production" ]; then
    warn "WEBHOOK_URL" "not set (required in production for Telegram bot)"
fi

if [ $MISSING_VARS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical env variables are set${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Some env variables are missing (see warnings above)${NC}"
fi
echo ""

# 6. Проверка ключевых файлов
echo "📁 Step 6: Key Files"
echo "-------------------"
check "middleware.ts exists" "test -f middleware.ts"
check "next.config.js exists" "test -f next.config.js"
check "lib/config/serverConfig.server.ts exists" "test -f lib/config/serverConfig.server.ts"
check "lib/config/appConfig.client.ts exists" "test -f lib/config/appConfig.client.ts"
check "lib/config/envValidation.ts exists" "test -f lib/config/envValidation.ts"
check "app/api/telegram/webhook/route.ts exists" "test -f app/api/telegram/webhook/route.ts"
check "app/auth/callback/route.ts exists" "test -f app/auth/callback/route.ts"
echo ""

# 7. Проверка структуры проекта
echo "🏗️  Step 7: Project Structure"
echo "------------------------------"
check "app directory exists" "test -d app"
check "lib directory exists" "test -d lib"
check "components directory exists" "test -d components"
check "middleware.ts exists" "test -f middleware.ts"
echo ""

# 8. Итоговый отчет
echo "📊 Verification Summary"
echo "======================"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
fi
if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
fi
echo ""

# Возвращаем код выхода
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Verification FAILED${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Verification passed with warnings${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Verification PASSED${NC}"
    exit 0
fi


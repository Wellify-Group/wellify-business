# Скрипт для настройки Telegram webhook (PowerShell)
# Использование: .\scripts\setup-telegram-webhook.ps1 -WebhookUrl "https://your-domain.com/api/telegram/webhook"

param(
    [string]$WebhookUrl = ""
)

# Загружаем переменные из .env.local
$envFile = ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$BOT_TOKEN = $env:TELEGRAM_BOT_TOKEN
$CHAT_ID = $env:TELEGRAM_SUPPORT_CHAT_ID

if (-not $BOT_TOKEN) {
    Write-Host "❌ Ошибка: TELEGRAM_BOT_TOKEN не найден в .env.local" -ForegroundColor Red
    exit 1
}

if (-not $CHAT_ID) {
    Write-Host "❌ Ошибка: TELEGRAM_SUPPORT_CHAT_ID не найден в .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Токен бота найден: $($BOT_TOKEN.Substring(0, 10))..." -ForegroundColor Green
Write-Host "✅ Chat ID: $CHAT_ID" -ForegroundColor Green

# Если URL не указан, пытаемся получить из переменных окружения
if (-not $WebhookUrl) {
    $WebhookUrl = $env:TELEGRAM_WEBHOOK_URL
    if (-not $WebhookUrl) {
        $AppUrl = $env:NEXT_PUBLIC_APP_URL
        if ($AppUrl) {
            $WebhookUrl = "$AppUrl/api/telegram/webhook"
        }
    }
}

if (-not $WebhookUrl) {
    Write-Host "❌ Ошибка: URL webhook не указан" -ForegroundColor Red
    Write-Host "💡 Используйте: .\scripts\setup-telegram-webhook.ps1 -WebhookUrl 'https://your-domain.com/api/telegram/webhook'" -ForegroundColor Yellow
    Write-Host "💡 Или установите TELEGRAM_WEBHOOK_URL или NEXT_PUBLIC_APP_URL в .env.local" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔧 Настройка Telegram webhook..." -ForegroundColor Cyan
Write-Host "📡 URL: $WebhookUrl" -ForegroundColor Cyan
Write-Host ""

try {
    $body = @{
        url = $WebhookUrl
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    if ($response.ok) {
        Write-Host "✅ Webhook успешно настроен!" -ForegroundColor Green
        Write-Host "📋 Описание: $($response.description)" -ForegroundColor Green
    } else {
        Write-Host "❌ Ошибка при настройке webhook: $($response.description)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Проверка текущего webhook..." -ForegroundColor Cyan

try {
    $webhookInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
    
    if ($webhookInfo.ok) {
        $info = $webhookInfo.result
        Write-Host "📡 Текущий URL: $($info.url)" -ForegroundColor Green
        Write-Host "✅ Ожидает обновления: $($info.pending_update_count)" -ForegroundColor Green
        
        if ($info.last_error_date) {
            Write-Host "⚠️  Последняя ошибка: $($info.last_error_message)" -ForegroundColor Yellow
            $errorDate = [DateTimeOffset]::FromUnixTimeSeconds($info.last_error_date).DateTime
            Write-Host "📅 Дата ошибки: $errorDate" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Ошибок нет" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "⚠️  Не удалось проверить статус webhook: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Готово! Webhook настроен." -ForegroundColor Green



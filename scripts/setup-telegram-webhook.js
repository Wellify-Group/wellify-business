// Скрипт для настройки Telegram webhook
// Использование: node scripts/setup-telegram-webhook.js

// Попытка загрузить dotenv, если он установлен
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv не установлен, используем переменные окружения напрямую
  console.log('ℹ️  dotenv не найден, используем переменные окружения напрямую');
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`
  : null;

if (!BOT_TOKEN) {
  console.error('❌ Ошибка: TELEGRAM_BOT_TOKEN не установлен в .env.local');
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error('❌ Ошибка: TELEGRAM_WEBHOOK_URL или NEXT_PUBLIC_APP_URL не установлены в .env.local');
  console.log('💡 Установите один из вариантов:');
  console.log('   - TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook');
  console.log('   - NEXT_PUBLIC_APP_URL=https://your-domain.com');
  process.exit(1);
}

async function setupWebhook() {
  try {
    console.log('🔧 Настройка Telegram webhook...');
    console.log(`📡 URL: ${WEBHOOK_URL}`);
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Webhook успешно настроен!');
      console.log(`📋 Описание: ${data.description || 'Нет описания'}`);
    } else {
      console.error('❌ Ошибка при настройке webhook:', data.description);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

async function checkWebhook() {
  try {
    console.log('\n🔍 Проверка текущего webhook...');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const data = await response.json();

    if (data.ok) {
      const info = data.result;
      console.log(`📡 Текущий URL: ${info.url || 'Не установлен'}`);
      console.log(`✅ Ожидает обновления: ${info.pending_update_count || 0}`);
      if (info.last_error_date) {
        console.log(`⚠️  Последняя ошибка: ${info.last_error_message}`);
        console.log(`📅 Дата ошибки: ${new Date(info.last_error_date * 1000).toLocaleString()}`);
      }
    } else {
      console.error('❌ Ошибка при проверке webhook:', data.description);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

async function main() {
  await setupWebhook();
  await checkWebhook();
}

main();


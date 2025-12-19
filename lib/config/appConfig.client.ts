// lib/config/appConfig.client.ts
// Клиентский конфиг - только NEXT_PUBLIC_* переменные
// Безопасно для использования в браузере

// Валидация клиентских переменных (только в браузере, не на сервере)
if (typeof window !== 'undefined') {
  const requiredVars = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = requiredVars.filter((v) => !process.env[v]);
  
  // Детальная диагностика
  if (missing.length > 0) {
    console.group('🔍 Диагностика Environment Variables');
    console.log('❌ Отсутствующие переменные:', missing);
    
    // Проверяем, есть ли вообще process.env в браузере
    const allEnvKeys = typeof process !== 'undefined' && process.env 
      ? Object.keys(process.env) 
      : [];
    const nextPublicKeys = allEnvKeys.filter(key => key.startsWith('NEXT_PUBLIC_'));
    
    console.log('📊 Статистика:');
    console.log(`  - Всего ключей в process.env: ${allEnvKeys.length}`);
    console.log(`  - NEXT_PUBLIC_* ключей: ${nextPublicKeys.length}`);
    
    if (nextPublicKeys.length > 0) {
      console.log('✅ Найденные NEXT_PUBLIC_* переменные:', 
        nextPublicKeys.reduce((acc, key) => {
          acc[key] = process.env[key] ? 'SET' : 'MISSING';
          return acc;
        }, {} as Record<string, string>)
      );
    } else {
      console.warn('⚠️ КРИТИЧНО: В браузере нет НИ ОДНОЙ NEXT_PUBLIC_* переменной!');
      console.warn('Это означает, что переменные не были встроены в bundle во время сборки.');
    }
    
    console.log('');
    console.log('🔧 Решение:');
    console.log('1. Откройте: https://dev.wellifyglobal.com/api/test-env');
    console.log('   → Если переменные есть на сервере, но отсутствуют в браузере:');
    console.log('   → Deployment был собран ДО добавления переменных в Vercel');
    console.log('');
    console.log('2. Vercel → Deployments → последний Preview → "Redeploy"');
    console.log('   → Или сделайте новый commit/push для запуска новой сборки');
    console.log('');
    console.log('3. Убедитесь, что в Vercel переменные установлены для:');
    console.log('   → "Preview" ИЛИ "All Pre-Production Environments"');
    console.log('');
    console.log('4. После пересборки проверьте снова - ошибка должна исчезнуть');
    console.groupEnd();
    
    // Дополнительно: попробуем получить переменные через API
    fetch('/api/test-env')
      .then(res => res.json())
      .then(data => {
        console.log('📡 Проверка на сервере (/api/test-env):', data);
        if (data.NEXT_PUBLIC_SUPABASE_URL === 'SET' && missing.includes('NEXT_PUBLIC_SUPABASE_URL')) {
          console.error('🚨 ПОДТВЕРЖДЕНО: Переменные есть на сервере, но отсутствуют в браузере!');
          console.error('   → Нужно пересобрать deployment в Vercel');
        }
      })
      .catch(err => console.warn('Не удалось проверить /api/test-env:', err));
  }
}

// Используем функцию вместо константы, чтобы переменные читались во время выполнения
// Это гарантирует, что Next.js встроит их значения в bundle
export function getAppConfig() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    telegramBotUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '',
    // Optional: can be separated by environment in Vercel via *_MAIN / *_DEV
    telegramApiUrl:
      process.env.NEXT_PUBLIC_TELEGRAM_API_URL_MAIN ||
      process.env.NEXT_PUBLIC_TELEGRAM_API_URL_DEV ||
      process.env.NEXT_PUBLIC_TELEGRAM_API_URL ||
      '',
  };
}

// Экспортируем также как константу для обратной совместимости
// Но используем функцию внутри, чтобы гарантировать чтение переменных
export const appConfig = getAppConfig();



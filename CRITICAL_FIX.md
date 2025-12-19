# КРИТИЧЕСКИЙ ПЛАН ДЕЙСТВИЙ

## Проблема
Переменные есть в Vercel, но не попадают в клиентский bundle.

## ЧТО СДЕЛАТЬ ПРЯМО СЕЙЧАС:

### 1. ЗАКОММИТЬ И ЗАПУШИТЬ ИЗМЕНЕНИЯ
```bash
git add next.config.js lib/config/appConfig.client.ts
git commit -m "fix: force env vars into client bundle"
git push
```

### 2. ПРОВЕРИТЬ ЛОГИ СБОРКИ В VERCEL
1. Vercel → Deployments → последний deployment
2. Откройте **"Build Logs"** (не Runtime Logs!)
3. Найдите строки с `[next.config.js]` - они покажут, были ли переменные доступны во время сборки
4. Если видите `MISSING` → переменные не были доступны во время сборки (проблема в Vercel)

### 3. ЕСЛИ В ЛОГАХ `MISSING`:
- Проверьте, что переменные установлены для **"Preview"** ИЛИ **"All Pre-Production Environments"**
- Убедитесь, что значения не пустые
- Сделайте **Redeploy БЕЗ кэша** (если есть опция)

### 4. ЕСЛИ В ЛОГАХ `SET`, НО В БРАУЗЕРЕ НЕТ:
- Очистите кэш браузера (Ctrl+Shift+R)
- Проверьте `/api/check-client-env` - должны быть видны переменные

## ВАЖНО:
Логи сборки (Build Logs) ≠ Runtime Logs
Нужны именно Build Logs, чтобы увидеть, что было во время сборки!


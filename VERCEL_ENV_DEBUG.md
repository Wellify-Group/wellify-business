# Диагностика проблемы с Environment Variables в Vercel

## Проблема
Переменные `NEXT_PUBLIC_*` есть на сервере, но отсутствуют в клиентском bundle.

## Критические шаги для диагностики

### 1. Проверьте логи сборки в Vercel
1. Vercel Dashboard → ваш проект → **Deployments**
2. Найдите последний Preview deployment
3. Откройте **"Build Logs"**
4. Найдите строки с `NEXT_PUBLIC_` - они должны быть видны во время сборки
5. Если переменных нет в логах → они не были доступны во время сборки

### 2. Проверьте scope переменных
1. Vercel → **Settings** → **Environment Variables**
2. Убедитесь, что переменные установлены для:
   - ✅ **"Preview"** ИЛИ
   - ✅ **"All Pre-Production Environments"**
3. ❌ НЕ только для "Production"

### 3. Проверьте значения переменных
В Vercel Environment Variables проверьте, что:
- `NEXT_PUBLIC_APP_URL` = `https://dev.wellifyglobal.com`
- `NEXT_PUBLIC_SUPABASE_URL` = ваш Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ваш anon key

### 4. Сделайте полный rebuild БЕЗ кэша
1. Vercel → Deployments → последний deployment
2. Три точки (⋮) → **"Redeploy"**
3. ⚠️ **ВАЖНО:** Если есть опция "Use existing Build Cache" → выключите её
4. Или сделайте новый commit/push для принудительной пересборки

### 5. После изменений в `next.config.js`
1. Сделайте commit изменений:
   ```bash
   git add next.config.js
   git commit -m "fix: explicitly set NEXT_PUBLIC env vars in next.config.js"
   git push
   ```
2. Это запустит новую сборку с явным указанием переменных

## Что проверить после пересборки

1. **Очистите кэш браузера:**
   - DevTools (F12) → правый клик на кнопку обновления → "Очистить кэш и жесткая перезагрузка"
   - Или `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)

2. **Проверьте переменные в браузере:**
   - Откройте: `https://dev.wellifyglobal.com/api/check-client-env`
   - Эта страница покажет, какие переменные доступны в клиентском bundle

3. **Проверьте консоль:**
   - Откройте `https://dev.wellifyglobal.com/register`
   - Откройте консоль (F12)
   - Ошибка должна исчезнуть

## Если проблема осталась

Если после всех шагов проблема осталась, проверьте:

1. **Логи сборки в Vercel** - были ли переменные доступны во время сборки?
2. **Scope переменных** - правильно ли установлен scope?
3. **Значения переменных** - не пустые ли они?
4. **Кэш Vercel** - возможно, используется старый кэш

## Контакты для поддержки

Если проблема не решается, обратитесь в поддержку Vercel с:
- Скриншотом Environment Variables из Vercel Dashboard
- Логами сборки (Build Logs)
- Описанием проблемы


# Исправление флоу регистрации - Итоговая инструкция

## ✅ Что исправлено

### 1. Фронтенд - Передача метаданных в signUp

**Файл:** `app/register/RegisterDirectorClient.tsx` (строки 347-367)

Теперь в `signUp` передаются все необходимые данные:

```typescript
// Формируем полное имя из компонентов
const fullName = [
  baseData.lastName.trim(),
  baseData.firstName.trim(),
  baseData.middleName.trim(),
]
  .filter(Boolean)
  .join(" ");

const { error } = await supabase.auth.signUp({
  email: form.email.trim(),
  password: baseData.password,
  options: {
    data: {
      first_name: baseData.firstName.trim(),    // ✅
      last_name: baseData.lastName.trim(),      // ✅
      middle_name: baseData.middleName.trim(),  // ✅
      full_name: fullName,                      // ✅ НОВОЕ
      birth_date: baseData.birthDate,           // ✅
    },
    emailRedirectTo: redirectTo,  // ✅ Уже настроен
  },
});
```

**Статус:** ✅ Исправлено

### 2. Фронтенд - Улучшенный polling через supabase.auth.getUser()

**Файл:** `app/register/RegisterDirectorClient.tsx` (строки 198-270)

Теперь используется прямой вызов `supabase.auth.getUser()` вместо API:

```typescript
// Авто-проверка e-mail через поллинг supabase.auth.getUser()
useEffect(() => {
  if (emailStatus !== "link_sent" && emailStatus !== "checking") return;
  if (!form.email.trim()) return;
  if (emailVerified) return; // Если уже подтверждён, не проверяем

  let cancelled = false;
  let intervalId: NodeJS.Timeout | null = null;

  const checkEmailConfirmation = async () => {
    // Проверяем статус через supabase.auth.getUser()
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user && user.email_confirmed_at) {
      // Email подтверждён!
      setEmailStatus("verified");
      setEmailVerified(true);
      setFormSuccess("Поздравляем! Ваш e-mail подтверждён.");
      // Останавливаем интервал
      if (intervalId) {
        clearInterval(intervalId);
      }
    }
  };

  // Запускаем проверку сразу и каждые 2.5 секунды
  checkEmailConfirmation();
  intervalId = setInterval(checkEmailConfirmation, 2500);

  return () => {
    cancelled = true;
    if (intervalId) clearInterval(intervalId);
  };
}, [emailStatus, form.email, emailVerified, supabase]);
```

**Преимущества:**
- ✅ Проверка каждые 2.5 секунды
- ✅ Автоматическая остановка при подтверждении
- ✅ Прямая проверка через Supabase (быстрее, чем через API)
- ✅ Улучшенный UX с сообщением "Поздравляем! Ваш e-mail подтверждён."

**Статус:** ✅ Исправлено

### 3. SQL-миграция для Supabase

**Файл:** `supabase/migrations/007_final_handle_new_user.sql`

**Инструкция:**
1. Откройте **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Скопируйте **весь** файл `supabase/migrations/007_final_handle_new_user.sql`
3. Вставьте в SQL Editor и выполните

**Что делает миграция:**
- ✅ Добавляет все необходимые поля в `profiles` (если их нет)
- ✅ Обновляет функцию `handle_new_user()` для чтения метаданных из `raw_user_meta_data`
- ✅ Заполняет `first_name`, `last_name`, `middle_name`, `full_name`, `birth_date` при создании пользователя
- ✅ Устанавливает `email_verified = false` при создании
- ✅ Создает триггер `on_auth_user_created` для автоматического вызова
- ✅ Обновляет функцию `sync_email_verified()` для автоматического обновления статуса
- ✅ Создает триггер `on_auth_user_email_confirmed` для синхронизации `email_verified`

## 📋 Проверка после применения

### 1. Примените SQL-миграцию

Выполните файл `supabase/migrations/007_final_handle_new_user.sql` в Supabase SQL Editor.

### 2. Проверьте, что миграция применена

```sql
-- Проверка полей
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('first_name', 'last_name', 'middle_name', 'birth_date', 'email_verified', 'full_name');
-- Должно вернуть 6 строк

-- Проверка функции
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_user';
-- Должно вернуть 1 строку

-- Проверка триггера
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
-- Должно вернуть 1 строку
```

### 3. Протестируйте регистрацию

1. **Зарегистрируйте нового пользователя** через форму `/register`
   - Заполните шаг 1: имя, фамилия, отчество, дата рождения, пароль
   - На шаге 2: введите email и нажмите "Отправить письмо"

2. **Сразу после signUp проверьте в Supabase:**
   ```sql
   SELECT 
     id,
     email,
     first_name,
     last_name,
     middle_name,
     full_name,
     birth_date,
     email_verified
   FROM profiles 
   WHERE email = 'ваш_email@example.com';
   ```
   
   **Ожидаемый результат:**
   - ✅ `first_name`, `last_name`, `middle_name`, `full_name`, `birth_date` должны быть заполнены
   - ✅ `email_verified` должен быть `false`

3. **Проверьте метаданные в auth.users:**
   ```sql
   SELECT 
     id,
     email,
     raw_user_meta_data
   FROM auth.users
   WHERE email = 'ваш_email@example.com';
   ```
   
   Должны быть поля: `first_name`, `last_name`, `middle_name`, `full_name`, `birth_date`

4. **Проверьте polling на фронтенде:**
   - После отправки письма должен появиться статус "Проверяем подтверждение e-mail..."
   - Проверка должна происходить каждые 2.5 секунды

5. **Подтвердите email** по ссылке из письма

6. **Проверьте автоматическое обновление:**
   - Статус должен автоматически измениться на "Поздравляем! Ваш e-mail подтверждён."
   - Должна появиться кнопка "Далее"
   - Polling должен остановиться

7. **Проверьте в Supabase после подтверждения:**
   ```sql
   SELECT email_verified, first_name, last_name 
   FROM profiles 
   WHERE email = 'ваш_email@example.com';
   ```
   
   **Ожидаемый результат:**
   - ✅ `email_verified` должен стать `true`

## 🔍 Отладка

### Если поля все еще NULL:

1. **Проверьте метаданные:**
   ```sql
   SELECT raw_user_meta_data 
   FROM auth.users 
   WHERE email = 'ваш_email@example.com';
   ```
   
   Если метаданные пустые → проблема в фронтенде (проверьте консоль браузера)

2. **Проверьте логи Supabase:**
   - Dashboard → **Logs** → **Postgres Logs**
   - Ищите ошибки с `handle_new_user`

3. **Проверьте триггер:**
   ```sql
   SELECT 
     trigger_name,
     event_manipulation,
     action_statement
   FROM information_schema.triggers
   WHERE trigger_name = 'on_auth_user_created';
   ```

### Если polling не работает:

1. Откройте консоль браузера (F12)
2. Проверьте ошибки при вызове `supabase.auth.getUser()`
3. Убедитесь, что пользователь авторизован (после signUp создается сессия)

## 📝 Итоговый результат

После применения всех изменений:

1. ✅ При `signUp` метаданные передаются в `raw_user_meta_data`
2. ✅ Триггер автоматически создает профиль с заполненными полями
3. ✅ Polling проверяет статус каждые 2.5 секунды через `supabase.auth.getUser()`
4. ✅ UI автоматически обновляется при подтверждении email
5. ✅ `email_verified` автоматически становится `true` после подтверждения

**Флоу регистрации полностью автоматизирован!** 🎉


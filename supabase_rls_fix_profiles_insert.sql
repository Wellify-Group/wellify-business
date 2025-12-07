-- Добавление RLS политики для INSERT в таблицу profiles
-- Это необходимо для того, чтобы пользователи могли создавать свой профиль через upsert

-- Политика: пользователи могут создавать свой собственный профиль
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Альтернативно, можно использовать более общую политику для INSERT и UPDATE:
-- CREATE POLICY "Users can manage own profile"
--   ON profiles FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);


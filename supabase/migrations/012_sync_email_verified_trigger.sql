-- supabase/migrations/012_sync_email_verified_trigger.sql
-- Триггер для автоматической синхронизации email_verified из auth.users.email_confirmed_at
-- Это единственный источник истины для подтверждения email

-- 1. Создаём/обновляем функцию синхронизации
create or replace function public.sync_profile_email_verified()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles p
  set email_verified = (new.email_confirmed_at is not null),
      updated_at = now()
  where p.id = new.id;

  return new;
end;
$$;

-- 2. Удаляем старый триггер если существует
drop trigger if exists trg_sync_profile_email_verified on auth.users;

-- 3. Создаём триггер AFTER INSERT OR UPDATE OF email_confirmed_at
create trigger trg_sync_profile_email_verified
after insert or update of email_confirmed_at
on auth.users
for each row
execute function public.sync_profile_email_verified();

-- 4. Убеждаемся, что email_verified по умолчанию false при создании профиля
-- (уже должно быть в handle_new_user, но на всякий случай)
do $$
begin
  -- Если колонка email_verified не существует, создаём её
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'profiles' and column_name = 'email_verified'
  ) then
    alter table profiles add column email_verified boolean default false not null;
  end if;
end $$;

-- 5. Синхронизируем существующие записи (на случай если триггер не сработал ранее)
update public.profiles p
set 
  email_verified = (u.email_confirmed_at is not null),
  updated_at = now()
from auth.users u
where p.id = u.id
  and (
    -- Обновляем если значения не совпадают
    (u.email_confirmed_at is not null and (p.email_verified is null or p.email_verified = false))
    or
    (u.email_confirmed_at is null and (p.email_verified is null or p.email_verified = true))
  );

-- 6. Комментарии для документации
comment on function public.sync_profile_email_verified() is 
'Автоматически синхронизирует profiles.email_verified с auth.users.email_confirmed_at. 
Единственный источник истины - auth.users.email_confirmed_at.';

comment on trigger trg_sync_profile_email_verified on auth.users is 
'Триггер для автоматической синхронизации email_verified при изменении email_confirmed_at';

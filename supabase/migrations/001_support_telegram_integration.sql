-- Сессии поддержки
create table if not exists support_sessions (
  cid uuid primary key,
  user_name text,
  user_email text,
  user_id text,
  created_at timestamptz default now()
);

-- Сообщения
create table if not exists support_messages (
  id bigserial primary key,
  cid uuid not null references support_sessions(cid) on delete cascade,
  direction text not null check (direction in ('user', 'admin')),
  text text not null,
  created_at timestamptz default now()
);

create index if not exists idx_support_messages_cid_created_at
  on support_messages (cid, created_at);

-- Связка "telegram message_id -> cid"
create table if not exists support_telegram_threads (
  id bigserial primary key,
  cid uuid not null references support_sessions(cid) on delete cascade,
  telegram_message_id bigint not null unique,
  created_at timestamptz default now()
);


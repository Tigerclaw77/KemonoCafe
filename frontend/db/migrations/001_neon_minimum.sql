create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  password_salt text not null,
  display_name text,
  user_context text,
  email_verified_rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists user_sessions_user_id_idx on user_sessions(user_id);
create index if not exists user_sessions_expires_at_idx on user_sessions(expires_at);

create table if not exists message_balances (
  user_id uuid primary key references users(id) on delete cascade,
  remaining_messages integer not null default 0 check (remaining_messages >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_stats (
  user_id uuid primary key references users(id) on delete cascade,
  daily_free_used integer not null default 0 check (daily_free_used >= 0),
  daily_free_date date,
  last_visit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_nominations (
  user_id uuid primary key references users(id) on delete cascade,
  companion_id text not null,
  expires_at timestamptz not null,
  grace_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_nominations_companion_id_idx on user_nominations(companion_id);
create index if not exists user_nominations_expires_at_idx on user_nominations(expires_at);

create table if not exists email_captures (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  companion_id text,
  source text not null default 'unknown',
  created_at timestamptz not null default now()
);

create table if not exists companion_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  companion_id text not null,
  memory_type text not null check (memory_type in ('fact', 'preference', 'boundary')),
  content text not null,
  importance numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists companion_memories_lookup_idx
  on companion_memories(user_id, companion_id, importance desc, created_at desc);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  companion_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_lookup_idx
  on chat_messages(user_id, companion_id, created_at desc);

-- AI chat assistant (scoped to script/YouTube strategy help) — one
-- continuous thread per user, same owner-only RLS pattern as every other
-- table in this directory.
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index chat_messages_user_id_created_at_idx on public.chat_messages(user_id, created_at);

alter table public.chat_messages enable row level security;

create policy "Users can view own chat messages"
  on public.chat_messages for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own chat messages"
  on public.chat_messages for insert
  with check ((select auth.uid()) = user_id);

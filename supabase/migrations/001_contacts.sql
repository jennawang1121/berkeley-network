create extension if not exists pgcrypto;

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  company text not null default '' check (char_length(company) <= 1000),
  role text not null default '' check (char_length(role) <= 1000),
  met_at text not null default '' check (char_length(met_at) <= 1000),
  notes text not null default '' check (char_length(notes) <= 1000),
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contacts enable row level security;
alter table public.contacts force row level security;

create policy "Users select their own contacts" on public.contacts for select to authenticated using (auth.uid() = user_id);
create policy "Users insert their own contacts" on public.contacts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update their own contacts" on public.contacts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete their own contacts" on public.contacts for delete to authenticated using (auth.uid() = user_id);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger contacts_set_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create index contacts_user_created_idx on public.contacts (user_id, created_at desc);

revoke all on public.contacts from anon;
grant select, insert, update, delete on public.contacts to authenticated;

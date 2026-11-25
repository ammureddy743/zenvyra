-- Zenvyra Database Schema for Supabase (PostgreSQL)
-- Run this in your Supabase SQL Editor.

-- 1. Profiles & Daily Free Credits
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  daily_credits integer not null default 10,
  credits_reset_at timestamptz not null default (date_trunc('day', now()) + interval '1 day'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Processing History & 24h File Retention Tracking
create table if not exists public.edit_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  tool_id text not null check (
    tool_id in (
      'background-remover',
      'upscaler',
      'object-remover',
      'photo-restorer',
      'passport-maker'
    )
  ),
  model_used text,
  status text not null default 'completed' check (status in ('processing', 'completed', 'failed')),
  original_filename text,
  width integer,
  height integer,
  export_format text not null default 'png',
  input_storage_path text,
  output_storage_path text,
  processing_ms integer,
  error_message text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create index if not exists idx_edit_jobs_user_created
  on public.edit_jobs (user_id, created_at desc);

create index if not exists idx_edit_jobs_expires_at
  on public.edit_jobs (expires_at);

alter table public.edit_jobs enable row level security;

create policy "Users can view own edit jobs"
  on public.edit_jobs for select
  using (auth.uid() = user_id);

create policy "Users can insert own edit jobs"
  on public.edit_jobs for insert
  with check (auth.uid() = user_id);

-- 3. Daily Credit Reset & Deduction RPC
create or replace function public.consume_credit(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_credits integer;
  v_reset_at timestamptz;
begin
  select daily_credits, credits_reset_at
  into v_credits, v_reset_at
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if now() >= v_reset_at then
    v_credits := 10;
    update public.profiles
    set daily_credits = 10,
        credits_reset_at = date_trunc('day', now()) + interval '1 day',
        updated_at = now()
    where id = p_user_id;
  end if;

  if v_credits <= 0 then
    raise exception 'Daily free credits exhausted';
  end if;

  update public.profiles
  set daily_credits = v_credits - 1,
      updated_at = now()
  where id = p_user_id;

  return v_credits - 1;
end;
$$;

-- 4. Admin Summary View (Total Users, Usage per Tool, Errors)
create or replace view public.admin_tool_metrics as
select
  tool_id,
  count(*) as total_runs,
  count(*) filter (where status = 'completed') as successful_runs,
  count(*) filter (where status = 'failed') as error_count,
  round(avg(processing_ms)) as avg_processing_ms
from public.edit_jobs
group by tool_id;

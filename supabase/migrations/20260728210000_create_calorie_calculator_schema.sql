-- Calorie Calculator: authenticated-user meal records
-- Photos are intentionally not persisted in this version.

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

create table public.meal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  input_type text not null check (input_type in ('photo', 'text', 'both')),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name text not null check (char_length(btrim(food_name)) between 1 and 60),
  amount text not null check (char_length(btrim(amount)) between 1 and 30),
  memo text check (memo is null or char_length(memo) <= 200),
  estimated_calories integer not null check (estimated_calories >= 0 and estimated_calories <= 10000),
  final_calories integer not null check (final_calories >= 0 and final_calories <= 10000),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  estimate_reason text check (estimate_reason is null or char_length(estimate_reason) <= 500),
  recorded_at timestamptz not null,
  recorded_timezone text not null check (char_length(btrim(recorded_timezone)) between 1 and 100),
  status text not null default 'saved' check (status in ('draft', 'saved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calorie_estimates (
  id uuid primary key default gen_random_uuid(),
  meal_record_id uuid not null references public.meal_records (id) on delete cascade,
  estimated_calories integer not null check (estimated_calories >= 0 and estimated_calories <= 10000),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  summary_text text check (summary_text is null or char_length(summary_text) <= 500),
  model_name text check (model_name is null or char_length(model_name) <= 100),
  model_version text check (model_version is null or char_length(model_version) <= 100),
  created_at timestamptz not null default now()
);

create index meal_records_user_recorded_at_idx
  on public.meal_records (user_id, recorded_at desc);

create index calorie_estimates_meal_record_id_idx
  on public.calorie_estimates (meal_record_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger meal_records_set_updated_at
before update on public.meal_records
for each row execute procedure public.set_updated_at();

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email, avatar_url, last_login_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    now()
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        email = excluded.email,
        avatar_url = excluded.avatar_url,
        last_login_at = excluded.last_login_at;
  return new;
end;
$$;

create trigger auth_user_profile_sync
after insert or update of email, raw_user_meta_data, last_sign_in_at on auth.users
for each row execute procedure public.sync_profile_from_auth_user();

-- Supports projects where users signed in before this migration was applied.
insert into public.profiles (id, display_name, email, avatar_url, last_login_at)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  email,
  coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture'),
  coalesce(last_sign_in_at, now())
from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.meal_records enable row level security;
alter table public.calorie_estimates enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.meal_records from anon, authenticated;
revoke all on table public.calorie_estimates from anon, authenticated;

grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.meal_records to authenticated;
grant select, insert on table public.calorie_estimates to authenticated;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can read their own meal records"
on public.meal_records
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own meal records"
on public.meal_records
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own meal records"
on public.meal_records
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own meal records"
on public.meal_records
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read estimates for their own meal records"
on public.calorie_estimates
for select
to authenticated
using (
  exists (
    select 1
    from public.meal_records
    where meal_records.id = calorie_estimates.meal_record_id
      and meal_records.user_id = (select auth.uid())
  )
);

create policy "Users can add estimates for their own meal records"
on public.calorie_estimates
for insert
to authenticated
with check (
  exists (
    select 1
    from public.meal_records
    where meal_records.id = calorie_estimates.meal_record_id
      and meal_records.user_id = (select auth.uid())
  )
);

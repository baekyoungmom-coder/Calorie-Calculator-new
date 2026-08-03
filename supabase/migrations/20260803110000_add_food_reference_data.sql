-- Official food reference data is managed separately from user meal records.
-- Only server-side synchronization jobs may write to this table.

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_food_code text not null unique,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  normalized_name text not null check (char_length(btrim(normalized_name)) between 1 and 160),
  food_type text not null check (food_type in ('raw', 'processed', 'dish')),
  energy_kcal numeric(10, 3) not null check (energy_kcal >= 0),
  basis_grams numeric(10, 3) not null check (basis_grams > 0),
  serving_grams numeric(10, 3) check (serving_grams is null or serving_grams > 0),
  source_updated_at date,
  synced_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meal_records
  add column if not exists food_source_code text,
  add column if not exists food_basis_grams numeric(10, 3);

create index foods_normalized_name_idx on public.foods (normalized_name);
create index foods_active_normalized_name_idx
  on public.foods (is_active, normalized_name);

create trigger foods_set_updated_at
before update on public.foods
for each row execute procedure public.set_updated_at();

alter table public.foods enable row level security;
revoke all on table public.foods from anon, authenticated;
grant select on table public.foods to anon, authenticated;

create policy "Anyone can read active food reference data"
on public.foods
for select
to anon, authenticated
using (is_active = true);

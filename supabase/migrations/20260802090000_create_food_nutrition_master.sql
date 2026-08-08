-- Public food nutrition master data. This table is independent from user meal records.
create extension if not exists pg_trgm;

create table if not exists public.food_nutrition_master (
  id bigint generated always as identity primary key,
  food_code text not null unique,
  name text not null check (char_length(btrim(name)) between 1 and 200),
  category text,
  energy_kcal numeric not null check (energy_kcal >= 0),
  basis_amount numeric not null check (basis_amount > 0),
  basis_unit text not null check (basis_unit in ('g', 'ml')),
  reference_amount numeric check (reference_amount is null or reference_amount > 0),
  reference_unit text check (reference_unit is null or reference_unit in ('g', 'ml', '')),
  reference_kcal numeric check (reference_kcal is null or reference_kcal >= 0),
  protein_g numeric,
  fat_g numeric,
  carbohydrate_g numeric,
  sugars_g numeric,
  fiber_g numeric,
  sodium_mg numeric,
  source text not null,
  source_kind text not null check (source_kind in ('primary_db1', 'supplement_dbx')),
  source_created_at date,
  source_reference_date date,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists food_nutrition_master_name_trgm_idx
  on public.food_nutrition_master using gin (name gin_trgm_ops);

alter table public.food_nutrition_master enable row level security;
revoke all on table public.food_nutrition_master from anon, authenticated;
grant select on table public.food_nutrition_master to service_role;

comment on table public.food_nutrition_master is
  'Normalized public nutrition data imported from db1.csv with db.xlsx supplements.';

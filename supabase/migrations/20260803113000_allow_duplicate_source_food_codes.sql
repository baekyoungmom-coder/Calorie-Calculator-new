-- Some official source food codes identify multiple, separately named records.
-- The derived record key keeps each source row distinct without inventing a new food code.

alter table public.foods
  add column if not exists source_record_key text;

update public.foods
set source_record_key = source_food_code || ':' || normalized_name
where source_record_key is null;

alter table public.foods
  alter column source_record_key set not null;

alter table public.foods
  drop constraint if exists foods_source_food_code_key;

create unique index if not exists foods_source_record_key_idx
  on public.foods (source_record_key);

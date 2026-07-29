-- Add an optional, user-managed daily calorie goal.
-- This migration preserves all existing profile and meal record data.

alter table public.profiles
  add column if not exists daily_calorie_goal integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_daily_calorie_goal_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_daily_calorie_goal_check
      check (
        daily_calorie_goal is null
        or daily_calorie_goal between 500 and 10000
      );
  end if;
end;
$$;

grant update (daily_calorie_goal) on table public.profiles to authenticated;

drop policy if exists "Users can update their own calorie goal" on public.profiles;

create policy "Users can update their own calorie goal"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

comment on column public.profiles.daily_calorie_goal is
  'Optional daily calorie goal entered directly by the user.';

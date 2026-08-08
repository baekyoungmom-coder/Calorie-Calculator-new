# Supabase database migrations

`migrations/20260728210000_create_calorie_calculator_schema.sql` creates the
minimum persistent data model for the app:

- `profiles`: the signed-in user's display profile, synchronized from Supabase Auth
- `meal_records`: final meal records with separate estimated and user-confirmed calories
- `calorie_estimates`: compact estimation history without raw model responses

Photos are deliberately excluded from this migration. They are sent for analysis
only and are not stored in the database or Supabase Storage in this version.

## Apply

On a new project, apply `20260728210000_create_calorie_calculator_schema.sql` once
through the Supabase SQL Editor, or through the Supabase CLI after linking this
repository to the intended project.

If the SQL Editor reports that `profiles` already exists, do not delete that
table. Apply `20260728213000_complete_existing_profiles_schema.sql` instead. It
preserves the profile table and creates the remaining tables, triggers, indexes,
and RLS policies.

Do not paste API keys, service role keys, or database passwords into this
repository.

## Security guarantees

- Row Level Security is enabled on every application table.
- Authenticated users can access only rows that belong to their `auth.uid()`.
- Anonymous visitors receive no table permissions.
- A trigger creates or refreshes the user's `profiles` row from Supabase Auth.

-- Phase 1: school settings, school type, staff roles.
--
-- One deploy = one school, so school_settings is a single-row table
-- (id is a boolean pinned to true). Roles live in memberships; any
-- authenticated user WITHOUT a membership has no access to anything.

create schema if not exists private;
grant usage on schema private to authenticated;

create type app_role as enum ('owner', 'admin', 'staff', 'teacher');
create type school_type as enum ('college', 'k12');

create table school_settings (
  id                    boolean primary key default true check (id),
  name                  text not null,
  school_type           school_type not null default 'college',
  -- Per-label overrides on top of the school_type defaults, e.g.
  -- {"intake": {"one": "Cohort", "many": "Cohorts"}}
  terminology           jsonb not null default '{}'::jsonb,
  student_number_prefix text not null default 'S',
  next_student_number   int not null default 1,
  email                 text,
  phone                 text,
  address               text,
  logo_path             text,
  created_at            timestamptz not null default now()
);

create table memberships (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       app_role not null,
  created_at timestamptz not null default now()
);

-- Role helpers. security definer so they can read memberships without
-- tripping that table's own RLS; empty search_path + schema-qualified names
-- per the Supabase linter (see migration 12); auth.uid() wrapped in a
-- sub-select per migration 13.
create function private.current_app_role() returns app_role
language sql stable security definer set search_path = ''
as $$ select role from public.memberships where user_id = (select auth.uid()) $$;

create function private.is_member() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.memberships where user_id = (select auth.uid())) $$;

create function private.is_office() returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select role from public.memberships where user_id = (select auth.uid())) in ('owner', 'admin', 'staff'), false) $$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select role from public.memberships where user_id = (select auth.uid())) in ('owner', 'admin'), false) $$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- RLS for the new tables. Memberships are written only by the service role
-- (invites / role changes go through server actions that check the caller's
-- role first), so there are deliberately no write policies on it.
alter table school_settings enable row level security;
alter table memberships     enable row level security;

create policy "school_settings_select" on school_settings
  for select using ((select private.is_member()));
create policy "school_settings_update" on school_settings
  for update using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "memberships_select" on memberships
  for select using (user_id = (select auth.uid()) or (select private.is_admin()));

-- Replace the old "any authenticated user" policies with office-role checks.
-- Teachers get their own scoped policies in a later migration.
do $$
declare
  t text;
begin
  foreach t in array array['students', 'instructors', 'courses', 'intakes', 'enrolments'] loop
    execute format('drop policy %I on %I', t || '_select', t);
    execute format('drop policy %I on %I', t || '_insert', t);
    execute format('drop policy %I on %I', t || '_update', t);
    execute format('create policy %I on %I for select using ((select private.is_office()))', t || '_select', t);
    execute format('create policy %I on %I for insert with check ((select private.is_office()))', t || '_insert', t);
    execute format('create policy %I on %I for update using ((select private.is_office())) with check ((select private.is_office()))', t || '_update', t);
  end loop;
end $$;

drop policy "transactions_select" on transactions;
drop policy "transactions_insert" on transactions;
create policy "transactions_select" on transactions
  for select using ((select private.is_office()));
create policy "transactions_insert" on transactions
  for insert with check ((select private.is_office()));

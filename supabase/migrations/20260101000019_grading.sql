-- Phase 5: grading (a simple final grade per student, per subject, per term).
--
--   grade_scale_bands - the school's mark -> grade scale (editable by admins)
--   grades            - one row per enrolment x class subject x term
--                       (term_id null = a single final grade, for schools
--                       that do not use terms)
--
-- Who may write grades is enforced here in RLS, not in the UI:
--   * office staff: any grade, while the term is unlocked
--   * teachers: only their own class subjects, while the term is unlocked
--   * owners/admins: may also edit a locked term (they can unlock it anyway)

create table grade_scale_bands (
  id          uuid primary key default gen_random_uuid(),
  min_mark    numeric(5,2) not null unique check (min_mark between 0 and 100),
  grade       text not null,
  description text,
  is_pass     boolean not null default true
);

create function private.seed_grade_bands(p_type public.school_type) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_type = 'college' then
    insert into public.grade_scale_bands (min_mark, grade, description, is_pass) values
      (75, 'Distinction', null, true),
      (65, 'Merit', null, true),
      (50, 'Pass', null, true),
      (0,  'Fail', null, false);
  else
    insert into public.grade_scale_bands (min_mark, grade, description, is_pass) values
      (75, 'A', 'Excellent', true),
      (65, 'B', 'Very good', true),
      (50, 'C', 'Good', true),
      (40, 'D', 'Satisfactory', true),
      (30, 'E', 'Weak', false),
      (0,  'U', 'Ungraded', false);
  end if;
end $$;
revoke execute on function private.seed_grade_bands(public.school_type) from public, anon, authenticated;

create table grades (
  id                uuid primary key default gen_random_uuid(),
  enrolment_id      uuid not null references enrolments(id),
  intake_subject_id uuid not null references intake_subjects(id),
  term_id           uuid references terms(id),
  mark              numeric(5,2) check (mark between 0 and 100),
  grade             text,
  comment           text,
  entered_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint grades_unique unique nulls not distinct (enrolment_id, intake_subject_id, term_id)
);
create index on grades (intake_subject_id, term_id);
create index on grades (term_id);
create index on grades (entered_by);

-- Helpers used by the policies (security definer so they can read the
-- tables teachers cannot read directly).
create function private.teaches_intake_subject(p_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.intake_subjects
     where id = p_id and instructor_id = (select private.my_instructor_id())
  )
$$;
revoke execute on function private.teaches_intake_subject(uuid) from public, anon;
grant execute on function private.teaches_intake_subject(uuid) to authenticated;

create function private.term_locked(p_term_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select results_locked from public.terms where id = p_term_id), false)
$$;
revoke execute on function private.term_locked(uuid) from public, anon;
grant execute on function private.term_locked(uuid) to authenticated;

-- Keeps grades consistent: the student must be enrolled in the class the
-- subject belongs to; the grade is derived from the mark via the scale;
-- who/when are stamped by the database, not the client.
create function private.validate_grade() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_enrolment_intake uuid;
  v_subject_intake uuid;
  v_grade text;
begin
  select intake_id into v_enrolment_intake from public.enrolments where id = new.enrolment_id;
  select intake_id into v_subject_intake from public.intake_subjects where id = new.intake_subject_id;
  if v_enrolment_intake is distinct from v_subject_intake then
    raise exception 'that student is not enrolled in this class';
  end if;

  if new.mark is not null then
    select grade into v_grade
      from public.grade_scale_bands
     where min_mark <= new.mark
     order by min_mark desc
     limit 1;
    if v_grade is not null then
      new.grade := v_grade;
    end if;
  end if;

  new.entered_by := (select auth.uid());
  new.updated_at := now();
  return new;
end $$;
revoke execute on function private.validate_grade() from public, anon, authenticated;

create trigger grades_validate
  before insert or update on grades
  for each row execute function private.validate_grade();

alter table grade_scale_bands enable row level security;
alter table grades            enable row level security;

create policy "grade_bands_select" on grade_scale_bands for select using ((select private.is_member()));
create policy "grade_bands_insert" on grade_scale_bands for insert with check ((select private.is_admin()));
create policy "grade_bands_update" on grade_scale_bands for update
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "grade_bands_delete" on grade_scale_bands for delete using ((select private.is_admin()));

create policy "grades_select" on grades for select
  using ((select private.is_office()) or (select private.teaches_intake_subject(intake_subject_id)));

create policy "grades_insert" on grades for insert
  with check (
    ((select private.is_office()) or (select private.teaches_intake_subject(intake_subject_id)))
    and ((select private.is_admin()) or not (select private.term_locked(term_id)))
  );

create policy "grades_update" on grades for update
  using (
    ((select private.is_office()) or (select private.teaches_intake_subject(intake_subject_id)))
    and ((select private.is_admin()) or not (select private.term_locked(term_id)))
  )
  with check (
    ((select private.is_office()) or (select private.teaches_intake_subject(intake_subject_id)))
    and ((select private.is_admin()) or not (select private.term_locked(term_id)))
  );

-- Teachers need to read the term list for the term picker.
drop policy "terms_select" on terms;
create policy "terms_select" on terms for select using ((select private.is_member()));

-- Bulk save from the gradebook, in one round trip. SECURITY INVOKER, so the
-- policies above apply to the caller.
create function public.save_grades(p_intake_subject_id uuid, p_term_id uuid, p_rows jsonb) returns int
language plpgsql security invoker set search_path = ''
as $$
declare
  r jsonb;
  n int := 0;
begin
  for r in select * from jsonb_array_elements(p_rows) loop
    insert into public.grades (enrolment_id, intake_subject_id, term_id, mark, grade, comment)
    values (
      (r->>'enrolment_id')::uuid,
      p_intake_subject_id,
      p_term_id,
      nullif(r->>'mark', '')::numeric,
      nullif(trim(r->>'grade'), ''),
      nullif(trim(r->>'comment'), '')
    )
    on conflict on constraint grades_unique do update
      set mark = excluded.mark, grade = excluded.grade, comment = excluded.comment;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.save_grades(uuid, uuid, jsonb) from public, anon;
grant execute on function public.save_grades(uuid, uuid, jsonb) to authenticated;

-- Replace the whole scale in one transaction (admins only, via RLS). A band at
-- 0 is required so every mark maps to a grade.
create function public.save_grade_scale(p_bands jsonb) returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if not exists (select 1 from jsonb_array_elements(p_bands) b where (b->>'min_mark')::numeric = 0) then
    raise exception 'the scale needs a band starting at 0';
  end if;
  delete from public.grade_scale_bands where true;
  insert into public.grade_scale_bands (min_mark, grade, description, is_pass)
  select (b->>'min_mark')::numeric, trim(b->>'grade'), nullif(trim(b->>'description'), ''), coalesce((b->>'is_pass')::boolean, true)
    from jsonb_array_elements(p_bands) b;
end $$;
revoke execute on function public.save_grade_scale(jsonb) from public, anon;
grant execute on function public.save_grade_scale(jsonb) to authenticated;

create function public.reset_grade_scale() returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'not allowed';
  end if;
  delete from public.grade_scale_bands where true;
  perform private.seed_grade_bands((select school_type from public.school_settings));
end $$;
revoke execute on function public.reset_grade_scale() from public, anon;
grant execute on function public.reset_grade_scale() to authenticated;

-- New schools start with the default scale for their type.
create or replace function public.claim_school(p_name text, p_type public.school_type, p_prefix text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in';
  end if;
  insert into public.school_settings (name, school_type, student_number_prefix)
  values (trim(p_name), p_type, coalesce(nullif(trim(p_prefix), ''), 'S'));
  insert into public.memberships (user_id, role) values ((select auth.uid()), 'owner');
  perform private.seed_grade_bands(p_type);
end $$;

-- An existing school gets the default scale too.
do $$
declare t public.school_type;
begin
  select school_type into t from public.school_settings;
  if t is not null and not exists (select 1 from public.grade_scale_bands) then
    perform private.seed_grade_bands(t);
  end if;
end $$;

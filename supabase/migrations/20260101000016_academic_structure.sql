-- Phase 3: academic structure.
--   subjects        - what a course teaches (a "module" in a college)
--   terms           - optional academic calendar (semesters / school terms)
--   intake_subjects - a subject taught in one intake, by one teacher. Grades,
--                     the timetable and teacher access all hang off this row.

create table subjects (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id),
  name        text not null,
  code        text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);
create index on subjects (course_id, sort_order, name);

create table terms (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  academic_year  text not null,
  start_date     date not null,
  end_date       date not null,
  results_locked boolean not null default false,
  created_at     timestamptz not null default now(),
  check (end_date >= start_date)
);

create table intake_subjects (
  id            uuid primary key default gen_random_uuid(),
  intake_id     uuid not null references intakes(id),
  subject_id    uuid not null references subjects(id),
  instructor_id uuid references instructors(id),
  created_at    timestamptz not null default now(),
  unique (intake_id, subject_id)
);
create index on intake_subjects (instructor_id);
create index on intake_subjects (subject_id);

-- A new intake starts with one row per active subject of its course.
create function private.seed_intake_subjects() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.intake_subjects (intake_id, subject_id)
  select new.id, s.id from public.subjects s
   where s.course_id = new.course_id and s.archived_at is null;
  return null;
end $$;
revoke execute on function private.seed_intake_subjects() from public, anon, authenticated;

create trigger intakes_seed_subjects
  after insert on intakes
  for each row execute function private.seed_intake_subjects();

alter table subjects        enable row level security;
alter table terms           enable row level security;
alter table intake_subjects enable row level security;

create policy "subjects_select" on subjects for select using ((select private.is_office()));
create policy "subjects_insert" on subjects for insert with check ((select private.is_office()));
create policy "subjects_update" on subjects for update
  using ((select private.is_office())) with check ((select private.is_office()));

-- Terms (and locking results) are managed by owners/admins only; office staff can read them.
create policy "terms_select" on terms for select using ((select private.is_office()));
create policy "terms_insert" on terms for insert with check ((select private.is_admin()));
create policy "terms_update" on terms for update
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "terms_delete" on terms for delete using ((select private.is_admin()));

create policy "intake_subjects_select" on intake_subjects for select using ((select private.is_office()));
create policy "intake_subjects_insert" on intake_subjects for insert with check ((select private.is_office()));
create policy "intake_subjects_update" on intake_subjects for update
  using ((select private.is_office())) with check ((select private.is_office()));
create policy "intake_subjects_delete" on intake_subjects for delete using ((select private.is_office()));

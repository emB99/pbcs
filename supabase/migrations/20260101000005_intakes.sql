-- A cohort of one course with real dates. This is the scheduling unit.
create table intakes (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references courses(id),
  label         text,                        -- e.g. "Jan 2026"; derive from start_date if null
  start_date    date not null,
  end_date      date,
  instructor_id uuid references instructors(id),
  capacity      int,
  created_at    timestamptz not null default now()
);

create index on intakes (course_id, start_date desc);

create type course_kind as enum ('short_course', 'programme');

-- No hard-coded course names anywhere in the codebase. The catalogue is data.
create table courses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  kind          course_kind not null,
  default_price numeric(12,2) not null default 0,   -- a DEFAULT, always overridable
  default_weeks int,
  description   text,
  created_at    timestamptz not null default now(),
  archived_at   timestamptz
);

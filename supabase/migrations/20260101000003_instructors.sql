-- Deliberately minimal. The client has a handful of chefs.
create table instructors (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);

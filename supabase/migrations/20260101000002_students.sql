create table students (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  phone         text not null,              -- primary identifier in practice
  email         text,                       -- often blank
  national_id   text,
  address       text,
  notes         text,
  created_at    timestamptz not null default now(),
  archived_at   timestamptz                 -- soft delete only
);

create index on students (lower(full_name));
create index on students (phone);

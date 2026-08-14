create type enrolment_status as enum ('enrolled', 'completed', 'withdrawn');

-- A student may hold several enrolments at once (a short course while on a
-- programme). Balances roll up per enrolment and per student.
create table enrolments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id),
  intake_id     uuid not null references intakes(id),
  agreed_price  numeric(12,2) not null,      -- defaults from course, overridable per student
  price_note    text,                        -- why it differs from default, if it does
  status        enrolment_status not null default 'enrolled',
  enrolled_on   date not null default current_date,
  ended_on      date,
  created_at    timestamptz not null default now(),
  unique (student_id, intake_id)
);

create index on enrolments (student_id);
create index on enrolments (intake_id);

-- Email: a log of every message the app sends (or tried to), and reminder settings.
--
-- `messages` is an append-only log: office staff can read it and add to it, nobody
-- edits or deletes. Each row says who it was for, what it was about, and whether it
-- really went out:
--   sent     handed to the email provider
--   dry_run  development only: no provider is configured, so it was recorded, not sent
--   failed   the provider (or configuration) refused it
--   skipped  nothing to send to (no email address on file)

create type message_status as enum ('sent', 'dry_run', 'failed', 'skipped');

create table messages (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid references students(id),
  enrolment_id uuid references enrolments(id),
  kind         text not null check (kind in
                 ('receipt', 'balance_reminder', 'instalment_due', 'instalment_overdue', 'test')),
  -- The ledger row or instalment this was about, when there is one (used to avoid repeats).
  ref_id       uuid,
  to_email     text,
  subject      text not null,
  status       message_status not null,
  provider_id  text,
  error        text,
  sent_by      uuid references auth.users(id) default auth.uid(),
  created_at   timestamptz not null default now()
);
create index on messages (student_id, created_at desc);
create index on messages (kind, ref_id);
create index on messages (enrolment_id);
create index on messages (sent_by);

alter table messages enable row level security;
create policy "messages_select" on messages for select using ((select private.is_office()));
create policy "messages_insert" on messages for insert with check ((select private.is_office()));

-- Automatic reminders are off until a school turns them on.
alter table school_settings
  add column reminders_enabled boolean not null default false,
  add column reminder_days_before int not null default 3
    check (reminder_days_before between 0 and 30),
  add column reminder_repeat_days int not null default 7
    check (reminder_repeat_days between 1 and 60);

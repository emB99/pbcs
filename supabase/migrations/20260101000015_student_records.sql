-- Phase 2: richer student records.
--   * student_number (auto-assigned from school_settings), DOB, gender, photo, status
--   * phone becomes optional (children often have none)
--   * guardians / next of kin, student documents
--   * enrolment status history
--   * private storage buckets for photos and documents

create type student_status as enum ('active', 'graduated', 'withdrawn', 'suspended');

alter table students
  add column student_number text,
  add column date_of_birth  date,
  add column gender         text check (gender in ('female', 'male', 'other')),
  add column photo_path     text,
  add column status         student_status not null default 'active',
  alter column phone drop not null;

-- Sequential numbers: the UPDATE row-locks school_settings, so two
-- concurrent inserts can never receive the same number.
create function private.assign_student_number() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  prefix text;
  n int;
begin
  if new.student_number is not null and new.student_number <> '' then
    return new;
  end if;
  update public.school_settings
     set next_student_number = next_student_number + 1
   returning student_number_prefix, next_student_number - 1 into prefix, n;
  if not found then
    raise exception 'school is not set up yet';
  end if;
  new.student_number := prefix || lpad(n::text, 4, '0');
  return new;
end $$;
revoke execute on function private.assign_student_number() from public, anon, authenticated;

create trigger students_assign_number
  before insert on students
  for each row execute function private.assign_student_number();

alter table students alter column student_number set not null;
create unique index students_student_number_key on students (student_number);

create table guardians (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students(id) on delete cascade,
  full_name    text not null,
  relationship text,
  phone        text,
  email        text,
  is_primary   boolean not null default false,
  notes        text,
  created_at   timestamptz not null default now()
);
create index on guardians (student_id);
create unique index guardians_one_primary on guardians (student_id) where is_primary;

create table student_documents (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students(id) on delete cascade,
  name         text not null,
  storage_path text not null unique,
  content_type text,
  size_bytes   bigint,
  uploaded_by  uuid references auth.users(id) default auth.uid(),
  created_at   timestamptz not null default now()
);
create index on student_documents (student_id);

create table enrolment_status_events (
  id           uuid primary key default gen_random_uuid(),
  enrolment_id uuid not null references enrolments(id) on delete cascade,
  from_status  enrolment_status,
  to_status    enrolment_status not null,
  changed_by   uuid references auth.users(id) default auth.uid(),
  changed_at   timestamptz not null default now()
);
create index on enrolment_status_events (enrolment_id, changed_at);

create function private.log_enrolment_status() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.enrolment_status_events (enrolment_id, from_status, to_status)
    values (new.id, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.enrolment_status_events (enrolment_id, from_status, to_status)
    values (new.id, old.status, new.status);
  end if;
  return null;
end $$;
revoke execute on function private.log_enrolment_status() from public, anon, authenticated;

create trigger enrolments_log_status
  after insert or update of status on enrolments
  for each row execute function private.log_enrolment_status();

alter table guardians                enable row level security;
alter table student_documents        enable row level security;
alter table enrolment_status_events  enable row level security;

create policy "guardians_select" on guardians for select using ((select private.is_office()));
create policy "guardians_insert" on guardians for insert with check ((select private.is_office()));
create policy "guardians_update" on guardians for update
  using ((select private.is_office())) with check ((select private.is_office()));
create policy "guardians_delete" on guardians for delete using ((select private.is_office()));

create policy "student_documents_select" on student_documents for select using ((select private.is_office()));
create policy "student_documents_insert" on student_documents for insert with check ((select private.is_office()));
create policy "student_documents_delete" on student_documents for delete using ((select private.is_office()));

-- History is written by the trigger only; users can read it, never edit it.
create policy "enrolment_status_events_select" on enrolment_status_events
  for select using ((select private.is_office()));

-- Private buckets. Files are reached through signed URLs only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('student-photos', 'student-photos', false, 2097152,
     array['image/jpeg', 'image/png', 'image/webp']),
  ('student-documents', 'student-documents', false, 10485760, null)
on conflict (id) do nothing;

create policy "student_files_select" on storage.objects for select to authenticated
  using (bucket_id in ('student-photos', 'student-documents') and (select private.is_office()));
create policy "student_files_insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('student-photos', 'student-documents') and (select private.is_office()));
create policy "student_files_update" on storage.objects for update to authenticated
  using (bucket_id in ('student-photos', 'student-documents') and (select private.is_office()))
  with check (bucket_id in ('student-photos', 'student-documents') and (select private.is_office()));
create policy "student_files_delete" on storage.objects for delete to authenticated
  using (bucket_id in ('student-photos', 'student-documents') and (select private.is_office()));

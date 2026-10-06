-- Phase 7: timetable.
--
--   rooms           - places classes happen
--   timetable_slots - a weekly slot for one class subject (day, start, end,
--                     optional room, optional term). Slots with no term repeat
--                     all year.
--
-- A trigger refuses a slot that overlaps another on the same day when the two
-- share a teacher, a room or a class, and says which one clashed. Teachers have
-- no direct table access; they read their own week through my_timetable().

create table rooms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  capacity    int check (capacity > 0),
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);
create unique index rooms_name_active_key on rooms (lower(name)) where archived_at is null;

create table timetable_slots (
  id                uuid primary key default gen_random_uuid(),
  intake_subject_id uuid not null references intake_subjects(id),
  day_of_week       smallint not null check (day_of_week between 1 and 7),  -- 1 = Monday
  starts_at         time not null,
  ends_at           time not null,
  room_id           uuid references rooms(id),
  term_id           uuid references terms(id),
  created_at        timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index on timetable_slots (day_of_week, starts_at);
create index on timetable_slots (intake_subject_id);
create index on timetable_slots (room_id);
create index on timetable_slots (term_id);

create function private.check_slot_clash() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_intake uuid;
  v_teacher uuid;
  c record;
  days text[] := array['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
begin
  select intake_id, instructor_id into v_intake, v_teacher
    from public.intake_subjects where id = new.intake_subject_id;

  select s.day_of_week, s.starts_at, s.ends_at,
         sub.name as subject_name, i.label as intake_label, ins.full_name as teacher_name, r.name as room_name,
         (v_teacher is not null and other.instructor_id = v_teacher) as same_teacher,
         (new.room_id is not null and s.room_id = new.room_id) as same_room
    into c
    from public.timetable_slots s
    join public.intake_subjects other on other.id = s.intake_subject_id
    join public.subjects sub on sub.id = other.subject_id
    join public.intakes i on i.id = other.intake_id
    left join public.instructors ins on ins.id = other.instructor_id
    left join public.rooms r on r.id = s.room_id
   where s.id is distinct from new.id
     and s.day_of_week = new.day_of_week
     and s.starts_at < new.ends_at and new.starts_at < s.ends_at
     and (s.term_id is not distinct from new.term_id or s.term_id is null or new.term_id is null)
     and (
       other.intake_id = v_intake
       or (v_teacher is not null and other.instructor_id = v_teacher)
       or (new.room_id is not null and s.room_id = new.room_id)
     )
   order by (v_teacher is not null and other.instructor_id = v_teacher) desc,
            (new.room_id is not null and s.room_id = new.room_id) desc
   limit 1;

  if found then
    raise exception using
      errcode = '23P01',
      message = case
        when c.same_teacher then 'Teacher clash: ' || coalesce(c.teacher_name, 'the teacher') || ' is already teaching '
        when c.same_room then 'Room clash: ' || coalesce(c.room_name, 'the room') || ' is already used for '
        else 'Class clash: this class already has '
      end
      || c.subject_name || coalesce(' (' || c.intake_label || ')', '') || ' on '
      || days[c.day_of_week] || ' ' || to_char(c.starts_at, 'HH24:MI') || '–' || to_char(c.ends_at, 'HH24:MI');
  end if;
  return new;
end $$;
revoke execute on function private.check_slot_clash() from public, anon, authenticated;

create trigger timetable_slots_clash
  before insert or update on timetable_slots
  for each row execute function private.check_slot_clash();

alter table rooms           enable row level security;
alter table timetable_slots enable row level security;

create policy "rooms_select" on rooms for select using ((select private.is_office()));
create policy "rooms_insert" on rooms for insert with check ((select private.is_office()));
create policy "rooms_update" on rooms for update
  using ((select private.is_office())) with check ((select private.is_office()));

create policy "slots_select" on timetable_slots for select using ((select private.is_office()));
create policy "slots_insert" on timetable_slots for insert with check ((select private.is_office()));
create policy "slots_update" on timetable_slots for update
  using ((select private.is_office())) with check ((select private.is_office()));
create policy "slots_delete" on timetable_slots for delete using ((select private.is_office()));

-- The signed-in teacher's week: their own class subjects, for slots that run all
-- year or whose term is running today.
create function public.my_timetable() returns table (
  slot_id uuid,
  intake_subject_id uuid,
  day_of_week smallint,
  starts_at time,
  ends_at time,
  subject_name text,
  intake_label text,
  course_name text,
  room_name text
)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.intake_subject_id, s.day_of_week, s.starts_at, s.ends_at,
         sub.name, i.label, c.name, r.name
    from public.timetable_slots s
    join public.intake_subjects isub on isub.id = s.intake_subject_id
    join public.subjects sub on sub.id = isub.subject_id
    join public.intakes i on i.id = isub.intake_id
    join public.courses c on c.id = i.course_id
    left join public.rooms r on r.id = s.room_id
    left join public.terms t on t.id = s.term_id
   where isub.instructor_id = (select private.my_instructor_id())
     and (s.term_id is null or (t.start_date <= current_date and current_date <= t.end_date))
   order by s.day_of_week, s.starts_at
$$;
revoke execute on function public.my_timetable() from public, anon;
grant execute on function public.my_timetable() to authenticated;

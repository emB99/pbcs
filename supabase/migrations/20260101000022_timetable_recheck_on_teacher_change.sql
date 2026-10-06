-- Changing who teaches a class subject re-checks its existing slots for clashes
-- against the new teacher's other slots; a clash rejects the change.
create function private.recheck_slots_on_teacher_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.instructor_id is distinct from old.instructor_id then
    -- A no-op update fires the clash trigger on each of this subject's slots.
    update public.timetable_slots set id = id where intake_subject_id = new.id;
  end if;
  return null;
end $$;
revoke execute on function private.recheck_slots_on_teacher_change() from public, anon, authenticated;

create trigger intake_subjects_recheck_slots
  after update of instructor_id on intake_subjects
  for each row execute function private.recheck_slots_on_teacher_change();

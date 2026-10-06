-- Optional demo timetable (run after seed-demo.sql). Three rooms and a weekly
-- schedule with no overlaps for any teacher, room or class. Slots have no term,
-- so they repeat all year.

do $$
declare
  kitchen_a uuid; kitchen_b uuid; class1 uuid;
begin
  if exists (select 1 from public.timetable_slots) then
    raise notice 'Timetable already has slots; skipping.';
    return;
  end if;

  insert into public.rooms (name, capacity) values ('Kitchen A', 12) returning id into kitchen_a;
  insert into public.rooms (name, capacity) values ('Kitchen B', 12) returning id into kitchen_b;
  insert into public.rooms (name, capacity) values ('Classroom 1', 20) returning id into class1;

  insert into public.timetable_slots (intake_subject_id, day_of_week, starts_at, ends_at, room_id)
  select isub.id, v.day, v.starts::time, v.ends::time,
         case v.room when 'a' then kitchen_a when 'b' then kitchen_b else class1 end
    from (values
      ('January 2026',   'CUL101', 1, '09:00', '11:00', 'c'),  -- Food Safety, Mon
      ('January 2026',   'CUL102', 1, '11:30', '13:30', 'a'),  -- Pastry, Mon
      ('January 2026',   'CUL103', 2, '09:00', '11:00', 'c'),  -- Kitchen Management, Tue
      ('January 2026',   'CUL102', 3, '09:00', '12:00', 'a'),  -- Pastry (practical), Wed
      ('January 2026',   'CUL104', 4, '09:00', '11:00', 'c'),  -- Menu Planning, Thu
      ('October 2026',   'CAK1',   1, '14:00', '16:00', 'b'),  -- Buttercream, Mon
      ('October 2026',   'CAK2',   3, '14:00', '16:00', 'b'),  -- Fondant, Wed
      ('September 2026', 'BRD1',   5, '09:00', '12:00', 'a')   -- Yeast Doughs, Fri
    ) as v(intake_label, code, day, starts, ends, room)
    join public.intakes i on i.label = v.intake_label
    join public.subjects s on s.code = v.code
    join public.intake_subjects isub on isub.intake_id = i.id and isub.subject_id = s.id;
end $$;

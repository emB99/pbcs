-- Optional demo marks for the Diploma (run after seed-demo.sql). Gives the
-- gradebook, the student Grades tab and the term lock something to show.
-- Semester 1 results are entered and then locked; Semester 2 is left open.

do $$
begin
  if exists (select 1 from public.grades) then
    raise notice 'Grades already exist; skipping.';
    return;
  end if;

  insert into public.grades (enrolment_id, intake_subject_id, term_id, mark, comment)
  select e.id, isub.id, t.id,
         -- a stable spread of marks per student and subject
         30 + ((hashtext(s.full_name || sub.name) & 2147483647) % 61),
         null
    from public.intakes i
    join public.courses c on c.id = i.course_id and c.name = 'Diploma in Culinary Arts'
    join public.enrolments e on e.intake_id = i.id and e.status = 'enrolled'
    join public.students s on s.id = e.student_id
    join public.intake_subjects isub on isub.intake_id = i.id
    join public.subjects sub on sub.id = isub.subject_id
    join public.terms t on t.name = 'Semester 1'
   where i.label = 'January 2026';

  update public.grades set comment = 'Consistent, careful work.'
   where id = (select id from public.grades order by mark desc limit 1);

  update public.terms set results_locked = true where name = 'Semester 1';
end $$;

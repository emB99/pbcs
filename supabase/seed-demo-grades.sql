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

-- Report card comments for Semester 1. The head's comment is office-only (a trigger
-- strips it for anyone else, including a plain SQL run), so only the class teacher
-- comments are seeded here. To add a head's comment, enter it in the app as an office
-- user: Intakes > a class > Report cards.
insert into public.report_comments (enrolment_id, term_id, class_teacher_comment, head_comment)
select e.id, t.id,
       case ((hashtext(s.full_name) & 2147483647) % 3)
         when 0 then 'A steady term. Keep up the practice in the kitchen.'
         when 1 then 'Participates well. More revision before assessments would help.'
         else 'Shows real promise and a good attitude.'
       end,
       null
  from public.intakes i
  join public.enrolments e on e.intake_id = i.id and e.status = 'enrolled'
  join public.students s on s.id = e.student_id
  join public.terms t on t.name = 'Semester 1'
 where i.label = 'January 2026'
on conflict on constraint report_comments_unique do nothing;

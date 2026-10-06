-- Phase 6: report card comments.
--
--   class_teacher_comment - written by the class teacher (the instructor "in
--                           charge" of the intake) or the office
--   head_comment          - office only (enforced by a trigger)
--
-- Same lock rule as grades: a locked term stops everyone except owners/admins.

create table report_comments (
  id                    uuid primary key default gen_random_uuid(),
  enrolment_id          uuid not null references enrolments(id),
  term_id               uuid references terms(id),
  class_teacher_comment text,
  head_comment          text,
  updated_by            uuid references auth.users(id),
  updated_at            timestamptz not null default now(),
  constraint report_comments_unique unique nulls not distinct (enrolment_id, term_id)
);
create index on report_comments (term_id);
create index on report_comments (updated_by);

create function private.is_class_teacher_of_enrolment(p_enrolment_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
      from public.enrolments e
      join public.intakes i on i.id = e.intake_id
     where e.id = p_enrolment_id
       and i.instructor_id = (select private.my_instructor_id())
  )
$$;
revoke execute on function private.is_class_teacher_of_enrolment(uuid) from public, anon;
grant execute on function private.is_class_teacher_of_enrolment(uuid) to authenticated;

-- Teachers can never set or change the head's comment; stamps who/when.
create function private.guard_report_comment() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not (select private.is_office()) then
    if tg_op = 'INSERT' then
      new.head_comment := null;
    else
      new.head_comment := old.head_comment;
    end if;
  end if;
  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end $$;
revoke execute on function private.guard_report_comment() from public, anon, authenticated;

create trigger report_comments_guard
  before insert or update on report_comments
  for each row execute function private.guard_report_comment();

alter table report_comments enable row level security;

create policy "report_comments_select" on report_comments for select
  using ((select private.is_office()) or (select private.is_class_teacher_of_enrolment(enrolment_id)));

create policy "report_comments_insert" on report_comments for insert
  with check (
    ((select private.is_office()) or (select private.is_class_teacher_of_enrolment(enrolment_id)))
    and ((select private.is_admin()) or not (select private.term_locked(term_id)))
  );

create policy "report_comments_update" on report_comments for update
  using (
    ((select private.is_office()) or (select private.is_class_teacher_of_enrolment(enrolment_id)))
    and ((select private.is_admin()) or not (select private.term_locked(term_id)))
  )
  with check (
    ((select private.is_office()) or (select private.is_class_teacher_of_enrolment(enrolment_id)))
    and ((select private.is_admin()) or not (select private.term_locked(term_id)))
  );

-- Intakes the signed-in teacher is class teacher of ("in charge").
create function public.my_form_classes() returns table (
  intake_id uuid,
  intake_label text,
  start_date date,
  end_date date,
  course_name text,
  student_count bigint
)
language sql stable security definer set search_path = ''
as $$
  select i.id, i.label, i.start_date, i.end_date, c.name,
         (select count(*) from public.enrolments e where e.intake_id = i.id and e.status = 'enrolled')
    from public.intakes i
    join public.courses c on c.id = i.course_id
   where i.instructor_id = (select private.my_instructor_id())
   order by i.start_date desc
$$;
revoke execute on function public.my_form_classes() from public, anon;
grant execute on function public.my_form_classes() to authenticated;

-- Active students of an intake: for office staff, or that intake's class teacher.
create function public.intake_roster(p_intake_id uuid) returns table (
  enrolment_id uuid,
  student_id uuid,
  student_number text,
  full_name text
)
language sql stable security definer set search_path = ''
as $$
  select e.id, st.id, st.student_number, st.full_name
    from public.enrolments e
    join public.students st on st.id = e.student_id
    join public.intakes i on i.id = e.intake_id
   where e.intake_id = p_intake_id
     and e.status = 'enrolled'
     and ((select private.is_office()) or i.instructor_id = (select private.my_instructor_id()))
   order by st.full_name
$$;
revoke execute on function public.intake_roster(uuid) from public, anon;
grant execute on function public.intake_roster(uuid) to authenticated;

-- Bulk save from the comments page. SECURITY INVOKER: the policies above apply.
create function public.save_report_comments(p_term_id uuid, p_rows jsonb) returns int
language plpgsql security invoker set search_path = ''
as $$
declare
  r jsonb;
  n int := 0;
begin
  for r in select * from jsonb_array_elements(p_rows) loop
    insert into public.report_comments (enrolment_id, term_id, class_teacher_comment, head_comment)
    values (
      (r->>'enrolment_id')::uuid,
      p_term_id,
      nullif(trim(r->>'class_teacher_comment'), ''),
      nullif(trim(r->>'head_comment'), '')
    )
    on conflict on constraint report_comments_unique do update
      set class_teacher_comment = excluded.class_teacher_comment,
          head_comment = excluded.head_comment;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.save_report_comments(uuid, jsonb) from public, anon;
grant execute on function public.save_report_comments(uuid, jsonb) to authenticated;

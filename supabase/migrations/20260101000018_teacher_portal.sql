-- Phase 4: teacher accounts and portal.
--
-- Teachers get NO direct table access. They reach their classes through two
-- narrow security-definer functions (my_classes, class_roster) that return only
-- what a teacher needs: no fees, national IDs, notes, addresses or documents.
-- Grade writes get their own scoped policies in the grading phase.

alter table instructors
  add column user_id uuid unique references auth.users(id) on delete set null;

-- Teacher lookups filter intakes by instructor.
create index intakes_instructor_id_idx on intakes (instructor_id);

create function private.my_instructor_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.instructors
   where user_id = (select auth.uid()) and archived_at is null
$$;
revoke execute on function private.my_instructor_id() from public, anon;
grant execute on function private.my_instructor_id() to authenticated;

-- The subjects the signed-in teacher teaches, newest class first.
create function public.my_classes() returns table (
  intake_subject_id uuid,
  subject_name text,
  subject_code text,
  intake_id uuid,
  intake_label text,
  start_date date,
  end_date date,
  course_name text,
  student_count bigint
)
language sql stable security definer set search_path = ''
as $$
  select isub.id, s.name, s.code, i.id, i.label, i.start_date, i.end_date, c.name,
         (select count(*) from public.enrolments e
           where e.intake_id = i.id and e.status = 'enrolled')
    from public.intake_subjects isub
    join public.subjects s on s.id = isub.subject_id
    join public.intakes i on i.id = isub.intake_id
    join public.courses c on c.id = i.course_id
   where isub.instructor_id = (select private.my_instructor_id())
   order by i.start_date desc, s.sort_order, s.name
$$;
revoke execute on function public.my_classes() from public, anon;
grant execute on function public.my_classes() to authenticated;

-- Active students in one of the caller's class subjects (office staff may call
-- it for any). Returns only roster-safe columns.
create function public.class_roster(p_intake_subject_id uuid) returns table (
  enrolment_id uuid,
  student_id uuid,
  student_number text,
  full_name text,
  gender text,
  student_status public.student_status,
  guardian_name text,
  guardian_phone text
)
language sql stable security definer set search_path = ''
as $$
  select e.id, st.id, st.student_number, st.full_name, st.gender, st.status, g.full_name, g.phone
    from public.intake_subjects isub
    join public.enrolments e on e.intake_id = isub.intake_id and e.status = 'enrolled'
    join public.students st on st.id = e.student_id
    left join public.guardians g on g.student_id = st.id and g.is_primary
   where isub.id = p_intake_subject_id
     and (isub.instructor_id = (select private.my_instructor_id()) or (select private.is_office()))
   order by st.full_name
$$;
revoke execute on function public.class_roster(uuid) from public, anon;
grant execute on function public.class_roster(uuid) to authenticated;

-- Link an existing account (matched by the instructor's email) as that
-- instructor's teacher login. Owners/admins only. Returns one of:
--   linked | no_email | no_account | has_other_role | already_linked
create function public.grant_teacher_access(p_instructor_id uuid) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text;
  v_uid uuid;
  v_role public.app_role;
begin
  if not (select private.is_admin()) then
    raise exception 'not allowed';
  end if;
  select email into v_email from public.instructors where id = p_instructor_id;
  if v_email is null or v_email = '' then return 'no_email'; end if;
  select id into v_uid from auth.users where lower(email) = lower(v_email);
  if v_uid is null then return 'no_account'; end if;
  select role into v_role from public.memberships where user_id = v_uid;
  if v_role is not null and v_role <> 'teacher' then return 'has_other_role'; end if;

  insert into public.memberships (user_id, role) values (v_uid, 'teacher')
  on conflict (user_id) do nothing;
  update public.instructors set user_id = v_uid where id = p_instructor_id;
  return 'linked';
exception when unique_violation then
  return 'already_linked';
end $$;
revoke execute on function public.grant_teacher_access(uuid) from public, anon;
grant execute on function public.grant_teacher_access(uuid) to authenticated;

create function public.revoke_teacher_access(p_instructor_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid;
begin
  if not (select private.is_admin()) then
    raise exception 'not allowed';
  end if;
  select user_id into v_uid from public.instructors where id = p_instructor_id;
  if v_uid is not null then
    delete from public.memberships where user_id = v_uid and role = 'teacher';
    update public.instructors set user_id = null where id = p_instructor_id;
  end if;
end $$;
revoke execute on function public.revoke_teacher_access(uuid) from public, anon;
grant execute on function public.revoke_teacher_access(uuid) to authenticated;

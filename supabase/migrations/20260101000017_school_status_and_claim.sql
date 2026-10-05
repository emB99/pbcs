-- Public, read-only facts the login/setup screens need. Exposes only whether a
-- school exists and its display name.
create function public.school_status() returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'set_up', exists (select 1 from public.school_settings),
    'name', (select name from public.school_settings limit 1)
  )
$$;
revoke execute on function public.school_status() from public;
grant execute on function public.school_status() to anon, authenticated;

-- First-run setup: the caller becomes the owner of a brand-new school. The
-- single-row primary key on school_settings makes this safe against races:
-- the second caller gets a unique violation.
create function public.claim_school(p_name text, p_type public.school_type, p_prefix text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in';
  end if;
  insert into public.school_settings (name, school_type, student_number_prefix)
  values (trim(p_name), p_type, coalesce(nullif(trim(p_prefix), ''), 'S'));
  insert into public.memberships (user_id, role) values ((select auth.uid()), 'owner');
end $$;
revoke execute on function public.claim_school(text, public.school_type, text) from public, anon;
grant execute on function public.claim_school(text, public.school_type, text) to authenticated;

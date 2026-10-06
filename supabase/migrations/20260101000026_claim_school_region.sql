-- First-run setup also picks the school's currency, number/date format and timezone.
-- (The base currency locks after the first transaction, so setup is the place to choose it.)
drop function public.claim_school(text, public.school_type, text);

create function public.claim_school(
  p_name text,
  p_type public.school_type,
  p_prefix text,
  p_currency text default 'USD',
  p_locale text default 'en-ZW',
  p_timezone text default 'Africa/Harare'
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in';
  end if;
  insert into public.school_settings (name, school_type, student_number_prefix, base_currency, locale, timezone)
  values (trim(p_name), p_type, coalesce(nullif(trim(p_prefix), ''), 'S'), p_currency, p_locale, p_timezone);
  insert into public.memberships (user_id, role) values ((select auth.uid()), 'owner');
  perform private.seed_grade_bands(p_type);
end $$;
revoke execute on function public.claim_school(text, public.school_type, text, text, text, text) from public, anon;
grant execute on function public.claim_school(text, public.school_type, text, text, text, text) to authenticated;

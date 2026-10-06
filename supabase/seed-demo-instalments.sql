-- Optional demo payment plans (run after seed-demo.sql). Gives the student page and
-- the dashboard's "Overdue instalments" card something to show:
--   * Tafadzwa  : 6 monthly instalments from January, with most of them overdue
--   * Farai     : 4 monthly instalments from February, partly paid
--   * Nyasha    : 2 monthly instalments starting this month, the first part-paid
-- Does nothing if any plan already exists.

do $$
declare
  e record;
begin
  if exists (select 1 from public.instalments) then
    raise notice 'Instalments already exist; skipping.';
    return;
  end if;

  for e in
    select en.id, s.full_name, i.label
      from public.enrolments en
      join public.students s on s.id = en.student_id
      join public.intakes i on i.id = en.intake_id
     where en.status = 'enrolled'
       and ((s.full_name = 'Tafadzwa Sibanda' and i.label = 'January 2026')
         or (s.full_name = 'Farai Dube' and i.label = 'January 2026')
         or (s.full_name = 'Nyasha Chuma' and i.label = 'October 2026'))
  loop
    if e.full_name = 'Tafadzwa Sibanda' then
      perform public.create_instalment_plan(e.id, 6, date '2026-01-15', 'monthly', 1800);
    elsif e.full_name = 'Farai Dube' then
      perform public.create_instalment_plan(e.id, 4, date '2026-02-01', 'monthly', 1800);
    else
      perform public.create_instalment_plan(e.id, 2, date_trunc('month', current_date)::date + 14, 'monthly', 250);
    end if;
  end loop;
end $$;

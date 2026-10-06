-- Payment plans (instalments).
--
-- An instalment is a promise: "this much is due on this date" for an enrolment.
-- It is a schedule, not part of the ledger, so it can be edited or removed.
-- What has actually been paid still lives only in the append-only ledger; the
-- instalment_status view allocates it, earliest due date first, to say which
-- instalments are covered, part-paid or overdue.

create table instalments (
  id           uuid primary key default gen_random_uuid(),
  enrolment_id uuid not null references enrolments(id),
  due_on       date not null,
  amount       numeric(12,2) not null check (amount > 0),
  note         text,
  created_at   timestamptz not null default now()
);
create index on instalments (enrolment_id, due_on);

alter table instalments enable row level security;
create policy "instalments_select" on instalments for select using ((select private.is_office()));
create policy "instalments_insert" on instalments for insert with check ((select private.is_office()));
create policy "instalments_update" on instalments for update
  using ((select private.is_office())) with check ((select private.is_office()));
create policy "instalments_delete" on instalments for delete using ((select private.is_office()));

-- How much of each instalment the payments so far cover.
--   settled  = charged - balance for the enrolment (payments, less any reversals,
--              plus discounts), all in the base currency
--   covered  = the part of `settled` that reaches this instalment after the
--              earlier ones have been filled first
-- An instalment is overdue when it is not fully covered, its due date is before
-- today in the school's timezone, and the enrolment is still active.
create view instalment_status
with (security_invoker = true)
as
select
  b.instalment_id,
  b.enrolment_id,
  b.due_on,
  b.amount,
  b.note,
  b.covered,
  b.amount - b.covered                                   as outstanding,
  b.covered >= b.amount                                  as is_paid,
  b.enrolment_status = 'enrolled' and b.covered < b.amount and b.due_on < b.today
                                                         as is_overdue,
  case
    when b.enrolment_status = 'enrolled' and b.covered < b.amount and b.due_on < b.today
      then b.today - b.due_on
    else 0
  end                                                    as days_overdue
from (
  select
    i.id                as instalment_id,
    i.enrolment_id,
    i.due_on,
    i.amount,
    i.note,
    e.status            as enrolment_status,
    (now() at time zone coalesce((select timezone from public.school_settings), 'UTC'))::date as today,
    least(
      i.amount,
      greatest(
        coalesce(eb.charged - eb.balance, 0)
          - coalesce(sum(i.amount) over (
              partition by i.enrolment_id
              order by i.due_on, i.created_at, i.id
              rows between unbounded preceding and 1 preceding), 0),
        0
      )
    )                   as covered
  from public.instalments i
  join public.enrolments e on e.id = i.enrolment_id
  left join public.enrolment_balances eb on eb.enrolment_id = i.enrolment_id
) b;

-- Splits a total into equal instalments, exactly: every one is the total divided
-- by the count rounded down to the cent, and the last takes the remainder, so
-- the parts always add up to the total. SECURITY INVOKER: the policies above apply.
create function public.create_instalment_plan(
  p_enrolment_id uuid,
  p_count int,
  p_first_due date,
  p_frequency text,
  p_total numeric
) returns int
language plpgsql security invoker set search_path = ''
as $$
declare
  each_amount numeric;
  last_amount numeric;
  i int;
  due date;
begin
  if p_count < 1 or p_count > 36 then
    raise exception 'choose between 1 and 36 instalments';
  end if;
  if p_total is null or p_total <= 0 then
    raise exception 'the plan total must be more than zero';
  end if;
  if p_frequency not in ('weekly', 'fortnightly', 'monthly') then
    raise exception 'unknown frequency';
  end if;
  if exists (select 1 from public.instalments where enrolment_id = p_enrolment_id) then
    raise exception 'this enrolment already has a payment plan';
  end if;

  each_amount := trunc(p_total / p_count, 2);
  last_amount := p_total - each_amount * (p_count - 1);
  if each_amount <= 0 then
    raise exception 'that total is too small to split into % instalments', p_count;
  end if;

  for i in 0 .. p_count - 1 loop
    -- Counted from the first date each time, so a month-end start stays at month end.
    due := case p_frequency
             when 'weekly' then p_first_due + i * 7
             when 'fortnightly' then p_first_due + i * 14
             else (p_first_due + make_interval(months => i))::date
           end;
    insert into public.instalments (enrolment_id, due_on, amount)
    values (p_enrolment_id, due, case when i = p_count - 1 then last_amount else each_amount end);
  end loop;
  return p_count;
end $$;
revoke execute on function public.create_instalment_plan(uuid, int, date, text, numeric) from public, anon;
grant execute on function public.create_instalment_plan(uuid, int, date, text, numeric) to authenticated;

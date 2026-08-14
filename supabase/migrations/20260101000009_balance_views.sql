-- Query these views. Never recompute balances in application code.
--
-- security_invoker: views run with the querying user's own RLS, not the
-- view owner's — otherwise these would silently bypass row-level security.
create view enrolment_balances
with (security_invoker = true)
as
select
  e.id                as enrolment_id,
  e.student_id,
  e.intake_id,
  e.agreed_price,
  e.status,
  coalesce(sum(t.amount_usd) filter (where t.kind = 'charge'), 0)      as charged,
  coalesce(-sum(t.amount_usd) filter (where t.kind = 'payment'), 0)    as paid,
  coalesce(sum(t.amount_usd) filter (where t.kind = 'adjustment'), 0)  as adjustments,
  coalesce(sum(t.amount_usd), 0)                                       as balance,
  max(t.occurred_on) filter (where t.kind = 'payment')                 as last_payment_on
from enrolments e
left join transactions t on t.enrolment_id = e.id
group by e.id;

create view student_balances
with (security_invoker = true)
as
select
  s.id as student_id,
  s.full_name,
  s.phone,
  coalesce(sum(eb.balance), 0) as balance,
  max(eb.last_payment_on)      as last_payment_on
from students s
left join enrolment_balances eb on eb.student_id = s.id
group by s.id;

-- Not in the original handoff schema — added because the Intakes screen
-- needs "student count and outstanding total per intake" and the rule is
-- to query a view for that, never recompute balances in application code.
create view intake_summary
with (security_invoker = true)
as
select
  i.id as intake_id,
  count(e.id) filter (where e.status = 'enrolled')                       as active_students,
  coalesce(sum(eb.balance) filter (where e.status = 'enrolled'), 0)      as outstanding
from intakes i
left join enrolments e on e.intake_id = i.id
left join enrolment_balances eb on eb.enrolment_id = e.id
group by i.id;

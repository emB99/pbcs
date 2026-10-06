-- Receipts and invoices.
--
-- Every payment gets a receipt number and every charge an invoice number, stamped
-- by the database as the row is inserted:
--   * numbers are sequential and gap-free (the counter row is locked and only
--     advances if the insert commits)
--   * adjustments and reversals are not numbered
--   * clients cannot choose a number: whatever they send is overwritten
-- The counters and prefixes live in school_settings, like student numbers.

alter table school_settings
  add column receipt_prefix text not null default 'RCT-'
    check (receipt_prefix ~ '^[A-Za-z0-9/-]{0,10}$'),
  add column invoice_prefix text not null default 'INV-'
    check (invoice_prefix ~ '^[A-Za-z0-9/-]{0,10}$'),
  add column next_receipt_number int not null default 1,
  add column next_invoice_number int not null default 1,
  add column document_footer text check (char_length(document_footer) <= 500);

alter table transactions add column document_number text;
create unique index transactions_document_number_key
  on transactions (document_number) where document_number is not null;

-- Extend the existing per-row preparation trigger (currency handling) with numbering.
create or replace function private.prepare_transaction() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  s record;
  prefix text;
  n int;
begin
  select base_currency, accepted_currencies into s from public.school_settings;
  if not found then
    return new;
  end if;

  if new.currency is null then
    new.currency := s.base_currency;
  end if;

  if new.currency = s.base_currency then
    new.rate_to_base := 1;
  elsif new.reverses_id is null and not (new.currency = any (s.accepted_currencies)) then
    raise exception 'this school does not accept payments in %', new.currency
      using errcode = '23514';
  end if;

  -- Document numbers are never client-supplied.
  new.document_number := null;
  if new.kind = 'payment' then
    update public.school_settings
       set next_receipt_number = next_receipt_number + 1
     returning receipt_prefix, next_receipt_number - 1 into prefix, n;
    new.document_number := prefix || lpad(n::text, 5, '0');
  elsif new.kind = 'charge' then
    update public.school_settings
       set next_invoice_number = next_invoice_number + 1
     returning invoice_prefix, next_invoice_number - 1 into prefix, n;
    new.document_number := prefix || lpad(n::text, 5, '0');
  end if;
  return new;
end $$;

-- Number what already exists, oldest first. The ledger is append-only, so its
-- update guard is lifted for exactly this one-time backfill of the new column;
-- no amount, date or other fact is touched.
alter table transactions disable trigger transactions_no_update;

with numbered as (
  select id, kind, row_number() over (partition by kind order by created_at, occurred_on, id) as rn
    from transactions
   where kind in ('payment', 'charge')
)
update transactions t
   set document_number = (case n.kind when 'payment' then s.receipt_prefix else s.invoice_prefix end)
                         || lpad(n.rn::text, 5, '0')
  from numbered n, school_settings s
 where t.id = n.id;

update school_settings
   set next_receipt_number = (select count(*) from transactions where kind = 'payment') + 1,
       next_invoice_number = (select count(*) from transactions where kind = 'charge') + 1;

alter table transactions enable trigger transactions_no_update;

-- The enrolment balance as it stood right after a given transaction (everything
-- on that enrolment up to and including it, in the same date-then-entry order the
-- statement uses, in the base currency). SECURITY
-- INVOKER, so a caller only gets an answer for rows they can read.
create function public.balance_after(p_transaction_id uuid) returns numeric
language sql stable security invoker set search_path = ''
as $$
  select coalesce(sum(t2.amount_base), 0)
    from public.transactions t
    join public.transactions t2
      on t2.enrolment_id = t.enrolment_id
     and (t2.occurred_on, t2.created_at, t2.id) <= (t.occurred_on, t.created_at, t.id)
   where t.id = p_transaction_id
$$;
revoke execute on function public.balance_after(uuid) from public, anon;
grant execute on function public.balance_after(uuid) to authenticated;

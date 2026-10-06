-- Requests from the app arrive through PostgREST, whose connections reject an UPDATE
-- without a WHERE clause (pg-safeupdate), even inside a trigger. The counters live in
-- the single school_settings row (id is always true), so say so explicitly.

create or replace function private.assign_student_number() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  prefix text;
  n int;
begin
  if new.student_number is not null and new.student_number <> '' then
    return new;
  end if;
  update public.school_settings
     set next_student_number = next_student_number + 1
   where id
   returning student_number_prefix, next_student_number - 1 into prefix, n;
  if not found then
    raise exception 'school is not set up yet';
  end if;
  new.student_number := prefix || lpad(n::text, 4, '0');
  return new;
end $$;

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

  new.document_number := null;
  if new.kind = 'payment' then
    update public.school_settings
       set next_receipt_number = next_receipt_number + 1
     where id
     returning receipt_prefix, next_receipt_number - 1 into prefix, n;
    new.document_number := prefix || lpad(n::text, 5, '0');
  elsif new.kind = 'charge' then
    update public.school_settings
       set next_invoice_number = next_invoice_number + 1
     where id
     returning invoice_prefix, next_invoice_number - 1 into prefix, n;
    new.document_number := prefix || lpad(n::text, 5, '0');
  end if;
  return new;
end $$;

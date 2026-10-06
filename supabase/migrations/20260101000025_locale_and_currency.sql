-- Locale and currency.
--
--   base_currency       the currency balances are kept and reported in
--   accepted_currencies other currencies payments may be taken in (each carries
--                       an exchange rate into the base currency)
--   locale              how numbers and dates are written (BCP 47, e.g. en-ZW)
--   timezone            what "today" means for this school (IANA, e.g. Africa/Harare)
--   payment_methods     the methods offered when recording a payment
--
-- The ledger stays append-only. Its two USD-named columns are renamed to be
-- currency-neutral: amount_usd -> amount_base, rate_to_usd -> rate_to_base.

alter table school_settings
  add column base_currency text not null default 'USD'
    check (base_currency ~ '^[A-Z]{3}$'),
  add column accepted_currencies text[] not null default '{}',
  add column locale text not null default 'en-ZW'
    check (locale ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  add column timezone text not null default 'Africa/Harare'
    check (length(timezone) between 3 and 64),
  add column payment_methods text[] not null default array['cash', 'ecocash', 'bank_transfer', 'other'],
  add constraint payment_methods_count
    check (cardinality(payment_methods) between 1 and 12);

-- A currency is either the base or an extra, never both; codes are three capitals.
alter table school_settings
  add constraint accepted_currencies_shape check (
    not (base_currency = any (accepted_currencies))
    and array_to_string(accepted_currencies, ',') ~ '^([A-Z]{3}(,[A-Z]{3})*)?$'
  );

-- Schools that were already taking ZWG payments keep doing so.
update school_settings
   set accepted_currencies = array['ZWG']
 where exists (select 1 from transactions where currency = 'ZWG');

alter table transactions rename column amount_usd to amount_base;
alter table transactions rename column rate_to_usd to rate_to_base;
alter table transactions alter column currency drop default;

-- Fills in / checks the currency on every new ledger row:
--   * no currency given -> the school's base currency
--   * base currency     -> rate is exactly 1
--   * anything else must be one of the accepted extras (reversals are exempt,
--     so an old foreign-currency payment can always be reversed)
create function private.prepare_transaction() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  s record;
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
  return new;
end $$;
revoke execute on function private.prepare_transaction() from public, anon, authenticated;

create trigger transactions_prepare
  before insert on transactions
  for each row execute function private.prepare_transaction();

-- Balances are stored in the base currency, so it cannot change under existing
-- transactions.
create function private.lock_base_currency() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.base_currency is distinct from old.base_currency
     and exists (select 1 from public.transactions) then
    raise exception 'the base currency cannot be changed once transactions exist';
  end if;
  return new;
end $$;
revoke execute on function private.lock_base_currency() from public, anon, authenticated;

create trigger school_settings_lock_base_currency
  before update of base_currency on school_settings
  for each row execute function private.lock_base_currency();

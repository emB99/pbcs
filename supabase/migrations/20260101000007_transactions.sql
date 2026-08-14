create type txn_kind as enum ('charge', 'payment', 'adjustment');

create table transactions (
  id            uuid primary key default gen_random_uuid(),
  enrolment_id  uuid not null references enrolments(id),
  kind          txn_kind not null,

  -- SIGN CONVENTION: positive increases what the student owes.
  --   charge     > 0   (course fee, materials fee, late fee)
  --   payment    < 0
  --   adjustment either (discount/write-off negative, correction either way)
  amount        numeric(12,2) not null,
  currency      text not null default 'USD',
  rate_to_usd   numeric(14,4) not null default 1,
  amount_usd    numeric(12,2)
                generated always as (round(amount / rate_to_usd, 2)) stored,

  occurred_on   date not null default current_date,
  method        text,          -- 'cash' | 'ecocash' | 'bank_transfer' | 'other'
  reference     text,          -- EcoCash ref, bank ref, receipt number
  note          text,

  reverses_id   uuid references transactions(id),
  reversal_reason text,

  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),

  constraint charge_positive  check (kind <> 'charge'  or amount > 0),
  constraint payment_negative check (kind <> 'payment' or amount < 0),
  constraint amount_nonzero   check (amount <> 0),
  constraint rate_positive    check (rate_to_usd > 0),
  constraint reversal_has_reason
    check (reverses_id is null or reversal_reason is not null)
);

create index on transactions (enrolment_id, occurred_on desc);
create index on transactions (reverses_id);

-- A transaction can only be reversed once.
create unique index on transactions (reverses_id) where reverses_id is not null;

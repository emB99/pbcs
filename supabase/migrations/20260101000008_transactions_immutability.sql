-- Transactions are an append-only ledger. If a legitimate need to edit
-- appears later, the answer is a new transaction kind, not dropping this
-- trigger.
create or replace function block_txn_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'transactions are append-only; insert a reversal instead';
end $$;

create trigger transactions_no_update
  before update on transactions
  for each row execute function block_txn_mutation();

create trigger transactions_no_delete
  before delete on transactions
  for each row execute function block_txn_mutation();

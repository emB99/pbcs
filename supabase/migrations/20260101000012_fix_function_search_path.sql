-- Supabase's security linter flags functions with a mutable search_path as
-- a hijacking risk. block_txn_mutation() doesn't query anything (it only
-- raises), so pinning an empty search_path is a no-op behaviourally and
-- closes the warning.
alter function block_txn_mutation() set search_path = '';

-- Captures a migration that was applied to the hosted project without a file,
-- so a rebuild from this directory reaches the same state.
--
-- 0012 revoked the audit trigger function from `anon` and `authenticated`, but
-- Postgres grants EXECUTE to PUBLIC by default and both roles inherit it, so the
-- function stayed reachable as an RPC endpoint. Nothing should ever call a
-- trigger function directly.
revoke execute on function public.record_audit() from public;

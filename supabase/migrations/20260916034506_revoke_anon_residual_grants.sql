-- 0003_revoke_anon_residual_grants.sql
-- APPLIED to project vmxsxfawteycdvcxhxul on 2026-09-16.
--
-- WHY THIS EXISTS
--   0001 revoked anon from the children's-data tables but left the residual
--   table grants in place on the rest. Those tables were still reachable by the
--   anon role at the GRANT level; only RLS (every policy is TO authenticated)
--   stopped the read, so they answered the publishable key with an empty array
--   instead of a hard permission denial. Defence in depth was uneven: one
--   mistakenly-broad future policy would have exposed them.
--
--   Checked before applying: no client component imports the browser Supabase
--   client at all -- every read in src/ is server-side. The single anon-key
--   reader was /api/health counting registrations, switched to the service-role
--   client in the same commit.
--
--   Reversible:  grant select on public.<table> to anon;
--
-- AFTER: 19 tables, RLS on all 19, 0 anon-readable, 0 policies granting anon.
begin;

do $$
declare
  t text;
  residual text[] := array[
    'registrations',
    'camps',
    'cabins',
    'camp_sessions',
    'daily_photos',
    'emar_logs',
    'kaicalls_logs',
    'organizations',
    'transactions'
  ];
begin
  foreach t in array residual loop
    if to_regclass('public.' || t) is not null then
      execute format('revoke all on table public.%I from anon', t);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';

commit;

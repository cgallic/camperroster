-- Match the hosted ledger migration: placement is an authenticated workflow,
-- never a public/anonymous RPC. The later placement migration grants the
-- intended authenticated role back after replacing the function.
revoke execute on function public.assign_camper_to_cabin(uuid) from public, anon, authenticated;

-- Trigger functions must not remain reachable as RPC endpoints either.
revoke execute on function public.record_audit() from public, anon, authenticated;

-- Pre-existing functions with an unpinned search_path, which a caller could
-- otherwise redirect to objects of their own.
alter function public.guard_camps_stripe_customer_id()      set search_path = public, pg_temp;
alter function public.touch_camp_subscriptions_updated_at() set search_path = public, pg_temp;

-- Supabase exposes every function in `public` as an RPC endpoint. Neither of
-- these is meaningful to an anonymous caller.
revoke execute on function public.has_camp_role(uuid, text[]) from public, anon;
grant  execute on function public.has_camp_role(uuid, text[]) to authenticated;

-- An event-trigger function; nothing should ever call it directly.
-- Some fresh projects never had the dashboard-created helper, so guard the
-- legacy object instead of making clean installs depend on it.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;

-- Both tables carry RLS with no policy. That is correct in each case, so say so
-- rather than leaving it looking like an oversight.
do $$
begin
  if to_regclass('public.organizations') is not null then
    comment on table public.organizations is
      'DEPRECATED 2026-09: replaced by public.camps as the tenant root. RLS enabled with no policies -- deliberately unreachable.';
  end if;
end
$$;

comment on table public.stripe_events is
  'Webhook idempotency ledger. Service role only; no user-facing policy exists, and none should.';

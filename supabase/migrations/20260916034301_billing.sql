-- =============================================================================
-- 0002_billing.sql
-- CamperRoster: per-camper recurring billing (Stripe).
--
-- WHY THIS EXISTS
--   The app could not take money. POST /api/stripe/checkout fabricated a
--   session id of the form cs_test_<timestamp> and redirected the payer to
--   ?paid=true, which told a camp director money had moved when nothing had.
--   There was no customer record, no subscription table, and no webhook.
--
-- THE BILLING MODEL
--   The CAMP is the paying customer, not the parent. Published pricing is
--   per registered camper, per period:
--     Starter  $4.00 / registered camper
--     Pro      $6.00 / registered camper
--   Both are $0 in the off-season because the billed quantity follows the
--   registered-camper count. So a subscription here is a per-unit recurring
--   Stripe Price with quantity = count(registrations where camp_id = ...
--   and status in ('submitted','confirmed')).
--   The Network tier is custom volume pricing and deliberately has no
--   checkout path; it stays a sales conversation.
--
-- WHAT MAY MARK A CAMP AS PAID
--   Exactly one thing: a signature-verified Stripe webhook writing
--   public.camp_subscriptions through the service role. No client, no
--   authenticated user, and no other route may write these rows. That is
--   enforced below by RLS: authenticated members get SELECT only, anon gets
--   nothing at all, and there is no INSERT/UPDATE/DELETE policy for anyone.
--
-- DEPENDS ON 0001_tenancy_and_auth.sql
--   * public.camps is the tenant root (uuid primary key)
--   * public.camp_members links auth.users to camps
--   * public.is_camp_member(uuid) is the SECURITY DEFINER membership predicate
--     that avoids policy recursion -- this file calls it rather than writing
--     its own camp_members subquery, per 0001's note.
--
-- IDEMPOTENCY
--   Safe to run repeatedly. Every DDL statement is guarded (IF NOT EXISTS /
--   IF EXISTS / to_regclass) and every CREATE POLICY is preceded by
--   DROP POLICY IF EXISTS, matching 0001's conventions.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Preconditions
-- -----------------------------------------------------------------------------
-- Fail loudly and early rather than half-applying. If 0001 has not run, the
-- foreign keys and the membership predicate below do not exist.
do $$
begin
  if to_regclass('public.camps') is null then
    raise exception '0002_billing requires public.camps. Run 0001_tenancy_and_auth.sql first.';
  end if;
  if to_regclass('public.camp_members') is null then
    raise exception '0002_billing requires public.camp_members. Run 0001_tenancy_and_auth.sql first.';
  end if;
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_camp_member'
  ) then
    raise exception '0002_billing requires public.is_camp_member(uuid). Run 0001_tenancy_and_auth.sql first.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. camps.stripe_customer_id
-- -----------------------------------------------------------------------------
-- One Stripe Customer per camp, created on first checkout and reused after.
-- Reusing it is what keeps a camp's invoices, card, and portal in one place
-- instead of scattering a new customer across every checkout attempt.
alter table public.camps add column if not exists stripe_customer_id text;

create unique index if not exists camps_stripe_customer_id_key
  on public.camps (stripe_customer_id)
  where stripe_customer_id is not null;

comment on column public.camps.stripe_customer_id is
  'Stripe Customer id for this camp. Written only by the server (checkout route / verified webhook). Never accepted from a client.';

-- 0001 grants directors UPDATE on their own camps row, which would otherwise
-- let a director point their camp at ANOTHER camp's Stripe customer and then
-- open a Billing Portal session against that customer -- i.e. read and cancel
-- someone else's subscription. Column-level REVOKE does not help here because
-- a table-level UPDATE grant already covers every column, so the constraint is
-- enforced with a trigger instead.
--
-- Deliberately NOT security definer: the check needs the *calling* role
-- (`authenticated` / `anon` via PostgREST, `service_role` for the webhook),
-- and SECURITY DEFINER would replace it with the function owner.
create or replace function public.guard_camps_stripe_customer_id()
returns trigger
language plpgsql
as $$
begin
  if new.stripe_customer_id is distinct from old.stripe_customer_id
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
  then
    raise exception
      'camps.stripe_customer_id may only be changed by the billing service role (attempted by %)', current_user
      using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists camps_guard_stripe_customer_id on public.camps;
create trigger camps_guard_stripe_customer_id
  before update on public.camps
  for each row
  execute function public.guard_camps_stripe_customer_id();

-- -----------------------------------------------------------------------------
-- 2. public.camp_subscriptions
-- -----------------------------------------------------------------------------
-- A mirror of Stripe's subscription state, kept current by the webhook. It is
-- a cache of an external source of truth, never the source of truth itself --
-- which is why every column maps 1:1 onto a Stripe field and why nothing here
-- is computed locally.
create table if not exists public.camp_subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  camp_id                uuid not null references public.camps(id) on delete cascade,
  stripe_subscription_id text not null,
  stripe_customer_id     text,
  stripe_price_id        text,
  -- 'starter' | 'pro'. Nullable because a subscription created by hand in the
  -- Stripe dashboard against an unknown price cannot be classified, and
  -- guessing a plan would grant features nobody paid for.
  plan                   text,
  -- Stripe subscription status verbatim: incomplete, incomplete_expired,
  -- trialing, active, past_due, canceled, unpaid, paused.
  status                 text not null,
  -- Billed quantity = the camp's registered-camper count at billing time.
  quantity               integer,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- The webhook upserts on this key so replays and out-of-order deliveries
-- converge on one row instead of stacking duplicates.
create unique index if not exists camp_subscriptions_stripe_subscription_id_key
  on public.camp_subscriptions (stripe_subscription_id);

create index if not exists camp_subscriptions_camp_id_idx
  on public.camp_subscriptions (camp_id);

create index if not exists camp_subscriptions_camp_id_status_idx
  on public.camp_subscriptions (camp_id, status);

comment on table public.camp_subscriptions is
  'Stripe subscription state per camp. Written ONLY by the signature-verified webhook via the service role. A row here with status active/trialing is the single definition of "this camp is paid".';
comment on column public.camp_subscriptions.quantity is
  'Registered campers billed this period. Per-camper pricing means this is the multiplier on the unit price, not a seat count.';

create or replace function public.touch_camp_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists camp_subscriptions_touch_updated_at on public.camp_subscriptions;
create trigger camp_subscriptions_touch_updated_at
  before update on public.camp_subscriptions
  for each row
  execute function public.touch_camp_subscriptions_updated_at();

-- -----------------------------------------------------------------------------
-- 3. public.stripe_events  (webhook idempotency)
-- -----------------------------------------------------------------------------
-- Stripe retries, and can deliver the same event twice concurrently. The
-- handler claims the event id here first; the unique primary key is what makes
-- the second delivery a no-op. On handler failure the claim is deleted so the
-- retry is not swallowed.
create table if not exists public.stripe_events (
  id          text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);

create index if not exists stripe_events_received_at_idx
  on public.stripe_events (received_at desc);

comment on table public.stripe_events is
  'Processed Stripe event ids. Primary key = evt_... . Exists so a webhook replay cannot double-apply a billing change. Service role only; no user may read or write it.';

-- -----------------------------------------------------------------------------
-- 4. RLS
-- -----------------------------------------------------------------------------
-- camp_subscriptions: members of that camp may READ their own billing state
-- (the /billing page). Nobody may write it through PostgREST. The service role
-- bypasses RLS entirely and is the only writer.
alter table public.camp_subscriptions enable row level security;

drop policy if exists camp_subscriptions_member_select on public.camp_subscriptions;
create policy camp_subscriptions_member_select on public.camp_subscriptions
  for select to authenticated
  using (public.is_camp_member(camp_id));

-- No INSERT / UPDATE / DELETE policy is defined, on purpose. RLS denies by
-- default, so an authenticated user cannot create a subscription row that
-- claims their camp is paid. Do not add one.

-- stripe_events: RLS enabled with NO policies at all. Unreachable by anon and
-- authenticated alike; only the service role touches it.
alter table public.stripe_events enable row level security;


-- -----------------------------------------------------------------------------
-- 5. Table privileges -- anon gets nothing
-- -----------------------------------------------------------------------------
-- Supabase grants the anon and authenticated roles broad table privileges by
-- default. RLS already denies anon here because no policy names that role, but
-- removing the underlying privilege means a future "for select to public"
-- policy still cannot leak a camp's billing relationship or the event log.
revoke all on table public.camp_subscriptions from anon;
revoke all on table public.stripe_events      from anon;
revoke all on table public.stripe_events      from authenticated;

-- Members read their subscription; they never write it.
grant select on table public.camp_subscriptions to authenticated;
revoke insert, update, delete on table public.camp_subscriptions from authenticated;

-- The guard trigger is a safety net, not an access grant.
revoke all on function public.guard_camps_stripe_customer_id() from public, anon;

-- -----------------------------------------------------------------------------
-- 6. Tell PostgREST about all of the above
-- -----------------------------------------------------------------------------
notify pgrst, 'reload schema';

commit;

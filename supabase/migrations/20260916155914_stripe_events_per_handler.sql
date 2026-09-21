-- Two Stripe integrations now share one account: camps paying a subscription
-- (0002_billing.sql) and families paying tuition (0009_payments.sql). Both
-- endpoints receive every event, and both claimed the event id in this table
-- before doing any work.
--
-- With `id` alone as the primary key, whichever endpoint claimed an event first
-- made the other's claim fail — and that handler read the failure as an
-- already-processed replay and returned 200. Stripe sees success and never
-- retries. The result is a tuition payment that never settles, or a subscription
-- that stops syncing, with nothing anywhere reporting an error.
--
-- Keying on (id, handler) lets each integration claim the same event once.

alter table public.stripe_events
  add column if not exists handler text not null default 'billing';

comment on column public.stripe_events.handler is
  'Which integration claimed this event: billing (camp subscriptions) or tuition (family payments). Part of the key, so one integration cannot swallow the other''s delivery.';

alter table public.stripe_events drop constraint if exists stripe_events_pkey;
alter table public.stripe_events add primary key (id, handler);

-- Existing rows predate the split and were all written by the billing webhook,
-- so they keep that value. New writes must say which handler they are.
alter table public.stripe_events alter column handler drop default;

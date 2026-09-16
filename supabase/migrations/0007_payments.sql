-- Tuition, plans and financial aid.
--
-- Pricing is per household, not per camper: the camp's rates are tiered by how
-- many children a family registers, and every rate has an early and a regular
-- price that swap over on a fixed date. Both of those live as data here so the
-- camp can change rates without a deploy, and so a price can be explained after
-- the fact rather than recomputed from whatever the code does today.

create table if not exists public.pricing_tiers (
  id            uuid primary key default gen_random_uuid(),
  camp_id       uuid not null references public.camps(id) on delete cascade,
  season_id     uuid not null references public.seasons(id) on delete cascade,
  camper_count  int  not null check (camper_count >= 1),
  early_cents   int  not null,
  regular_cents int  not null,
  unique (season_id, camper_count)
);

comment on table public.pricing_tiers is
  'Total household tuition for N campers. The camp publishes tiers 1-4; larger families get a custom total on the invoice.';

create table if not exists public.family_invoices (
  id                   uuid primary key default gen_random_uuid(),
  camp_id              uuid not null references public.camps(id) on delete cascade,
  season_id            uuid not null references public.seasons(id) on delete cascade,
  family_id            uuid not null references public.families(id) on delete cascade,
  camper_count         int  not null default 0,
  -- What the tier table said at the moment the family registered. Kept even if
  -- the camp later edits its rates.
  tier_cents           int  not null default 0,
  -- Set by an admin for the rare family registering more than the published
  -- tiers cover. Overrides tier_cents when present.
  custom_total_cents   int,
  financial_aid_cents  int  not null default 0,
  -- Card fees, when the camp chooses to pass them on at checkout.
  processing_fee_cents int  not null default 0,
  amount_paid_cents    int  not null default 0,
  amount_refunded_cents int not null default 0,
  payment_plan         text not null default 'pay_in_full'
                         check (payment_plan in ('pay_in_full', 'two_payments', 'monthly')),
  priced_at            timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (season_id, family_id)
);

-- Generated rather than stored, so the balance can never drift from the parts.
alter table public.family_invoices
  add column if not exists total_due_cents int
  generated always as (
    coalesce(custom_total_cents, tier_cents) - financial_aid_cents + processing_fee_cents
  ) stored;

create table if not exists public.payment_schedule_items (
  id                 uuid primary key default gen_random_uuid(),
  camp_id            uuid not null references public.camps(id) on delete cascade,
  invoice_id         uuid not null references public.family_invoices(id) on delete cascade,
  due_on             date not null,
  amount_cents       int  not null,
  status             text not null default 'scheduled'
                       check (status in ('scheduled', 'paid', 'late', 'failed', 'waived')),
  reminder_sent_at   timestamptz,
  late_notice_sent_at timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists payment_schedule_due_idx
  on public.payment_schedule_items (camp_id, due_on) where status = 'scheduled';

create table if not exists public.payments (
  id                       uuid primary key default gen_random_uuid(),
  camp_id                  uuid not null references public.camps(id) on delete cascade,
  invoice_id               uuid not null references public.family_invoices(id) on delete cascade,
  schedule_item_id         uuid references public.payment_schedule_items(id) on delete set null,
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text unique,
  amount_cents             int  not null,
  refunded_cents           int  not null default 0,
  status                   text not null default 'pending'
                             check (status in ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  failure_reason           text,
  paid_at                  timestamptz,
  created_at               timestamptz not null default now()
);

create index if not exists payments_invoice_idx on public.payments (invoice_id);

create table if not exists public.financial_aid_applications (
  id                     uuid primary key default gen_random_uuid(),
  camp_id                uuid not null references public.camps(id) on delete cascade,
  season_id              uuid not null references public.seasons(id) on delete cascade,
  family_id              uuid not null references public.families(id) on delete cascade,
  amount_requested_cents int,
  narrative              text,
  status                 text not null default 'submitted'
                           check (status in ('submitted', 'under_review', 'approved', 'declined')),
  amount_awarded_cents   int,
  decided_by             uuid,
  decided_at             timestamptz,
  created_at             timestamptz not null default now(),
  unique (season_id, family_id)
);

/**
 * Household tuition for a given number of campers, at the rate in force on the
 * given date. Returns the largest published tier when a family exceeds them,
 * which the caller is expected to replace with a custom total.
 */
create or replace function public.family_tuition_cents(
  p_season_id uuid,
  p_camper_count int,
  p_as_of date default current_date
)
returns int
language plpgsql
stable
as $$
declare
  v_switch date;
  v_tier   public.pricing_tiers;
begin
  select early_rate_ends_on into v_switch from public.seasons where id = p_season_id;

  select * into v_tier
    from public.pricing_tiers
   where season_id = p_season_id
     and camper_count <= greatest(p_camper_count, 1)
   order by camper_count desc
   limit 1;

  if not found then
    return null;
  end if;

  return case
    when v_switch is not null and p_as_of < v_switch then v_tier.early_cents
    else v_tier.regular_cents
  end;
end;
$$;

/** Households still carrying a balance — the camp's "have not paid in full" list. */
create or replace view public.outstanding_balances as
  select i.id as invoice_id,
         i.camp_id,
         i.season_id,
         i.family_id,
         f.household_name,
         i.total_due_cents,
         i.amount_paid_cents,
         i.total_due_cents - i.amount_paid_cents as balance_cents,
         (select min(due_on) from public.payment_schedule_items s
           where s.invoice_id = i.id and s.status = 'scheduled') as next_due_on
    from public.family_invoices i
    join public.families f on f.id = i.family_id
   where i.total_due_cents > i.amount_paid_cents;

-- Policies ---------------------------------------------------------------------
alter table public.pricing_tiers               enable row level security;
alter table public.family_invoices             enable row level security;
alter table public.payment_schedule_items      enable row level security;
alter table public.payments                    enable row level security;
alter table public.financial_aid_applications  enable row level security;

drop policy if exists pricing_tiers_member_select on public.pricing_tiers;
create policy pricing_tiers_member_select on public.pricing_tiers
  for select to authenticated using (public.is_camp_member(camp_id));

drop policy if exists pricing_tiers_director_write on public.pricing_tiers;
create policy pricing_tiers_director_write on public.pricing_tiers
  for all to authenticated
  using (public.is_camp_director(camp_id))
  with check (public.is_camp_director(camp_id));

do $$
declare
  t text;
begin
  -- Money is the registrar's and the director's. Counselors and nurses have no
  -- reason to see what a family paid.
  foreach t in array array['family_invoices', 'payment_schedule_items', 'payments', 'financial_aid_applications'] loop
    execute format('drop policy if exists %1$s_finance_select on public.%1$I', t);
    execute format(
      'create policy %1$s_finance_select on public.%1$I for select to authenticated
         using (public.has_camp_role(camp_id, array[''registrar'']))', t);

    execute format('drop policy if exists %1$s_finance_write on public.%1$I', t);
    execute format(
      'create policy %1$s_finance_write on public.%1$I for all to authenticated
         using (public.has_camp_role(camp_id, array[''registrar'']))
         with check (public.has_camp_role(camp_id, array[''registrar'']))', t);
  end loop;
end;
$$;

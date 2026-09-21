-- Ledger-aligned reconstruction of the hosted cabin occupancy migration.
-- This file is already recorded as applied in production. It exists here so a
-- fresh database reaches the same pre-placement schema in timestamp order.

alter table public.cabins
  add column if not exists sort_order int not null default 0;

alter table public.cabins
  add column if not exists lead_counselor_id uuid
    references public.staff_applications(id) on delete set null;

create index if not exists cabins_lead_counselor_id_idx
  on public.cabins(lead_counselor_id);

drop view if exists public.cabin_occupancy;

create view public.cabin_occupancy as
  select c.id            as cabin_id,
         c.camp_id,
         c.name,
         c.gender,
         c.min_grade,
         c.max_grade,
         c.capacity,
         c.is_open,
         c.sort_order,
         c.lead_counselor_id,
         public.cabin_camper_count(c.id)              as campers_assigned,
         c.capacity - public.cabin_camper_count(c.id) as spots_remaining
    from public.cabins c;

alter view public.cabin_occupancy set (security_invoker = on);

-- Volunteer service areas, day-by-day availability, and the flags the camp
-- sorts on.
--
-- The coverage graphic the camp wants -- "how many will be in the kitchen on a
-- Thursday" -- needs availability recorded per day per person, not as a single
-- "full week / half week" label. So availability is one row per day, and the
-- half-week choice on the form expands into those rows.

create table if not exists public.service_areas (
  id            uuid primary key default gen_random_uuid(),
  camp_id       uuid not null references public.camps(id) on delete cascade,
  code          text not null,
  name          text not null,
  -- The minimum bodies this area needs on any given day, so the coverage view
  -- can show a shortfall rather than just a count.
  target_per_day int,
  display_order int not null default 0,
  unique (camp_id, code)
);

create table if not exists public.volunteer_assignments (
  id                   uuid primary key default gen_random_uuid(),
  camp_id              uuid not null references public.camps(id) on delete cascade,
  season_id            uuid not null references public.seasons(id) on delete cascade,
  staff_application_id uuid not null references public.staff_applications(id) on delete cascade,
  service_area_id      uuid not null references public.service_areas(id) on delete cascade,
  is_primary           boolean not null default true,
  assigned_at          timestamptz not null default now(),
  unique (season_id, staff_application_id, service_area_id)
);

create table if not exists public.volunteer_availability (
  id                   uuid primary key default gen_random_uuid(),
  camp_id              uuid not null references public.camps(id) on delete cascade,
  season_id            uuid not null references public.seasons(id) on delete cascade,
  staff_application_id uuid not null references public.staff_applications(id) on delete cascade,
  serves_on            date not null,
  unique (season_id, staff_application_id, serves_on)
);

create index if not exists volunteer_availability_day_idx
  on public.volunteer_availability (camp_id, season_id, serves_on);

-- Sorting categories the camp asked for by name.
alter table public.staff_applications
  add column if not exists is_first_time_counselor boolean not null default false,
  add column if not exists willing_to_become_lifeguard boolean not null default false,
  add column if not exists flagged_for_discussion boolean not null default false,
  add column if not exists discussion_note text;

/** Bodies per service area per day, against the area's target. */
create or replace view public.volunteer_coverage as
  select a.camp_id,
         av.season_id,
         av.serves_on,
         sa.id            as service_area_id,
         sa.name          as service_area,
         sa.target_per_day,
         count(distinct av.staff_application_id) as volunteers,
         sa.target_per_day - count(distinct av.staff_application_id) as shortfall
    from public.volunteer_availability av
    join public.volunteer_assignments a
      on a.staff_application_id = av.staff_application_id
     and a.season_id = av.season_id
    join public.service_areas sa on sa.id = a.service_area_id
   group by a.camp_id, av.season_id, av.serves_on, sa.id, sa.name, sa.target_per_day;

alter table public.service_areas           enable row level security;
alter table public.volunteer_assignments   enable row level security;
alter table public.volunteer_availability  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['service_areas', 'volunteer_assignments', 'volunteer_availability'] loop
    execute format('drop policy if exists %1$s_member_select on public.%1$I', t);
    execute format(
      'create policy %1$s_member_select on public.%1$I for select to authenticated
         using (public.is_camp_member(camp_id))', t);

    execute format('drop policy if exists %1$s_registrar_write on public.%1$I', t);
    execute format(
      'create policy %1$s_registrar_write on public.%1$I for all to authenticated
         using (public.has_camp_role(camp_id, array[''registrar'']))
         with check (public.has_camp_role(camp_id, array[''registrar'']))', t);
  end loop;
end;
$$;

-- Cabin placement, capacity and waitlists.
--
-- Placement lives in the database rather than the API because two families can
-- submit at the same moment. The assignment function locks the cabin row before
-- counting, so a cabin cannot be pushed past its cap by a race.

alter table public.cabins alter column capacity set default 12;
alter table public.cabins add column if not exists is_open boolean not null default true;
alter table public.cabins add column if not exists sort_order int not null default 0;

comment on column public.cabins.capacity is
  'Per-cabin cap, defaulting to the camp standard of 12 per grade and gender. Directors may raise it.';

create table if not exists public.cabin_assignments (
  id                   uuid primary key default gen_random_uuid(),
  camp_id              uuid not null references public.camps(id) on delete cascade,
  cabin_id             uuid not null references public.cabins(id) on delete cascade,
  registration_id      uuid references public.registrations(id) on delete cascade,
  staff_application_id uuid references public.staff_applications(id) on delete cascade,
  -- Sleep-in volunteers share a cabin with campers but never count against the
  -- camper cap, so the role has to be explicit.
  occupant_role        text not null default 'camper'
                         check (occupant_role in ('camper', 'teen_counselor', 'adult_sleep_in')),
  assigned_by          uuid,
  assigned_at          timestamptz not null default now(),
  constraint cabin_assignments_subject_ck check (
    (registration_id is not null) <> (staff_application_id is not null)
  )
);

create unique index if not exists cabin_assignments_one_per_registration_idx
  on public.cabin_assignments (registration_id) where registration_id is not null;
create unique index if not exists cabin_assignments_one_per_staff_idx
  on public.cabin_assignments (staff_application_id) where staff_application_id is not null;
create index if not exists cabin_assignments_cabin_idx on public.cabin_assignments (cabin_id);

create table if not exists public.waitlist_entries (
  id                   uuid primary key default gen_random_uuid(),
  camp_id              uuid not null references public.camps(id) on delete cascade,
  season_id            uuid not null references public.seasons(id) on delete cascade,
  registration_id      uuid references public.registrations(id) on delete cascade,
  staff_application_id uuid references public.staff_applications(id) on delete cascade,
  -- The bucket that was full. Grade/gender rather than a cabin id, so a newly
  -- created cabin for the same group can draw from the same queue.
  gender               text,
  grade                int,
  -- Monotonic per camp; ordering by it preserves sign-up order, which is how
  -- spots are offered fairly.
  position             bigint not null,
  status               text not null default 'waiting'
                         check (status in ('waiting', 'offered', 'accepted', 'declined', 'withdrawn')),
  offered_at           timestamptz,
  created_at           timestamptz not null default now(),
  constraint waitlist_subject_ck check (
    (registration_id is not null) <> (staff_application_id is not null)
  )
);

create sequence if not exists public.waitlist_position_seq;
alter table public.waitlist_entries alter column position set default nextval('public.waitlist_position_seq');

create index if not exists waitlist_queue_idx
  on public.waitlist_entries (camp_id, season_id, gender, grade, position)
  where status = 'waiting';

-- Counts only campers: sleep-in volunteers do not consume a camper spot.
create or replace function public.cabin_camper_count(p_cabin_id uuid)
returns int
language sql
stable
as $$
  select count(*)::int from public.cabin_assignments
   where cabin_id = p_cabin_id and occupant_role = 'camper';
$$;

/**
 * Places a camper in the first cabin matching their gender and grade that has
 * room, or adds them to the waitlist for that bucket. Returns the cabin id, or
 * null when waitlisted.
 */
create or replace function public.assign_camper_to_cabin(p_registration_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reg    record;
  v_camper record;
  v_cabin  record;
begin
  select r.*, c.gender, c.grade_entering, s.id as season_id
    into v_reg
    from public.registrations r
    join public.campers c on c.id = r.camper_id
    left join public.seasons s on s.camp_id = r.camp_id and s.is_active
   where r.id = p_registration_id;

  if not found then
    raise exception 'Registration % not found', p_registration_id;
  end if;

  if exists (select 1 from public.cabin_assignments where registration_id = p_registration_id) then
    return (select cabin_id from public.cabin_assignments where registration_id = p_registration_id);
  end if;

  -- Lock candidate cabins in a stable order so concurrent placements queue up
  -- rather than both reading the same pre-insert count.
  for v_cabin in
    select * from public.cabins
     where camp_id = v_reg.camp_id
       and is_open
       and gender = v_reg.gender
       and v_reg.grade_entering between min_grade and max_grade
     order by sort_order, name
     for update
  loop
    if public.cabin_camper_count(v_cabin.id) < v_cabin.capacity then
      insert into public.cabin_assignments (camp_id, cabin_id, registration_id, occupant_role)
      values (v_reg.camp_id, v_cabin.id, p_registration_id, 'camper');
      return v_cabin.id;
    end if;
  end loop;

  insert into public.waitlist_entries (camp_id, season_id, registration_id, gender, grade)
  values (v_reg.camp_id, v_reg.season_id, p_registration_id, v_reg.gender, v_reg.grade_entering)
  on conflict do nothing;

  return null;
end;
$$;

/** Remaining camper spots per cabin, for the capacity dashboard and the two-from-cap alert. */
create or replace view public.cabin_occupancy as
  select c.id            as cabin_id,
         c.camp_id,
         c.name,
         c.gender,
         c.min_grade,
         c.max_grade,
         c.capacity,
         c.is_open,
         public.cabin_camper_count(c.id)                as campers_assigned,
         c.capacity - public.cabin_camper_count(c.id)   as spots_remaining
    from public.cabins c;

-- Policies ---------------------------------------------------------------------
alter table public.cabin_assignments enable row level security;
alter table public.waitlist_entries  enable row level security;

drop policy if exists cabin_assignments_member_select on public.cabin_assignments;
create policy cabin_assignments_member_select on public.cabin_assignments
  for select to authenticated using (public.is_camp_member(camp_id));

drop policy if exists cabin_assignments_registrar_write on public.cabin_assignments;
create policy cabin_assignments_registrar_write on public.cabin_assignments
  for all to authenticated
  using (public.has_camp_role(camp_id, array['registrar']))
  with check (public.has_camp_role(camp_id, array['registrar']));

drop policy if exists waitlist_entries_member_select on public.waitlist_entries;
create policy waitlist_entries_member_select on public.waitlist_entries
  for select to authenticated using (public.is_camp_member(camp_id));

drop policy if exists waitlist_entries_registrar_write on public.waitlist_entries;
create policy waitlist_entries_registrar_write on public.waitlist_entries
  for all to authenticated
  using (public.has_camp_role(camp_id, array['registrar']))
  with check (public.has_camp_role(camp_id, array['registrar']));

-- Make cabin placement safe to expose, and race-proof the moves.
--
-- 0010 revoked EXECUTE on assign_camper_to_cabin because a SECURITY DEFINER
-- function in `public` is reachable by anyone holding the publishable key. But
-- the admin routes legitimately need to call it. Rather than routing around the
-- lock with a service-role client -- which would put the only access check in
-- the API layer -- the functions now verify the caller's role themselves, and
-- EXECUTE goes back to authenticated only.

create or replace function public.assign_camper_to_cabin(p_registration_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reg   record;
  v_cabin record;
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

  if not public.has_camp_role(v_reg.camp_id, array['registrar']) then
    raise exception 'Not authorised to place campers for this camp'
      using errcode = '42501';
  end if;

  if exists (select 1 from public.cabin_assignments where registration_id = p_registration_id) then
    return (select cabin_id from public.cabin_assignments where registration_id = p_registration_id);
  end if;

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

/**
 * Moves a camper into a named cabin. The destination row is locked before its
 * occupancy is counted, so two admins moving campers at once cannot both see
 * the same last free bed. `p_override` lets a director exceed the cap
 * deliberately; without it an over-capacity destination raises.
 */
create or replace function public.move_camper_to_cabin(
  p_registration_id uuid,
  p_cabin_id uuid,
  p_override boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cabin  record;
  v_camper record;
begin
  select * into v_cabin from public.cabins where id = p_cabin_id for update;
  if not found then
    raise exception 'Cabin % not found', p_cabin_id;
  end if;

  if not public.has_camp_role(v_cabin.camp_id, array['registrar']) then
    raise exception 'Not authorised to move campers for this camp'
      using errcode = '42501';
  end if;

  select c.* into v_camper
    from public.registrations r
    join public.campers c on c.id = r.camper_id
   where r.id = p_registration_id;

  if not found then
    raise exception 'Registration % not found', p_registration_id;
  end if;

  if v_camper.gender is distinct from v_cabin.gender
     or v_camper.grade_entering not between v_cabin.min_grade and v_cabin.max_grade then
    raise exception 'Camper does not match this cabin''s gender or grade band'
      using errcode = '23514';
  end if;

  if not p_override and public.cabin_camper_count(p_cabin_id) >= v_cabin.capacity then
    raise exception 'Cabin % is at capacity', v_cabin.name
      using errcode = '23514';
  end if;

  delete from public.cabin_assignments where registration_id = p_registration_id;

  insert into public.cabin_assignments (camp_id, cabin_id, registration_id, occupant_role)
  values (v_cabin.camp_id, p_cabin_id, p_registration_id, 'camper');
end;
$$;

/**
 * Seats a teen counselor or adult sleep-in volunteer. These share the cabin but
 * are not counted against the camper cap, which is why they bypass the capacity
 * check rather than reusing the camper path.
 */
create or replace function public.assign_staff_to_cabin(
  p_staff_application_id uuid,
  p_cabin_id uuid,
  p_occupant_role text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cabin record;
begin
  if p_occupant_role not in ('teen_counselor', 'adult_sleep_in') then
    raise exception 'Occupant role must be teen_counselor or adult_sleep_in'
      using errcode = '23514';
  end if;

  select * into v_cabin from public.cabins where id = p_cabin_id;
  if not found then
    raise exception 'Cabin % not found', p_cabin_id;
  end if;

  if not public.has_camp_role(v_cabin.camp_id, array['registrar']) then
    raise exception 'Not authorised to seat volunteers for this camp'
      using errcode = '42501';
  end if;

  delete from public.cabin_assignments where staff_application_id = p_staff_application_id;

  insert into public.cabin_assignments (camp_id, cabin_id, staff_application_id, occupant_role)
  values (v_cabin.camp_id, p_cabin_id, p_staff_application_id, p_occupant_role);
end;
$$;

/**
 * Takes someone off the waitlist into a cabin, either one the admin names or
 * the first with room. Marks the entry accepted only if a seat was actually
 * found, so a failed placement leaves them queued in their original position.
 */
create or replace function public.promote_from_waitlist(
  p_waitlist_entry_id uuid,
  p_cabin_id uuid default null,
  p_override boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_entry record;
  v_cabin uuid;
begin
  select * into v_entry from public.waitlist_entries where id = p_waitlist_entry_id for update;
  if not found then
    raise exception 'Waitlist entry % not found', p_waitlist_entry_id;
  end if;

  if not public.has_camp_role(v_entry.camp_id, array['registrar']) then
    raise exception 'Not authorised to manage this waitlist'
      using errcode = '42501';
  end if;

  if v_entry.registration_id is null then
    raise exception 'Only camper waitlist entries can be promoted here';
  end if;

  if p_cabin_id is not null then
    perform public.move_camper_to_cabin(v_entry.registration_id, p_cabin_id, p_override);
    v_cabin := p_cabin_id;
  else
    v_cabin := public.assign_camper_to_cabin(v_entry.registration_id);
    if v_cabin is null then
      return null;
    end if;
  end if;

  update public.waitlist_entries
     set status = 'accepted', offered_at = coalesce(offered_at, now())
   where id = p_waitlist_entry_id;

  return v_cabin;
end;
$$;

revoke execute on function public.assign_camper_to_cabin(uuid) from public, anon;
revoke execute on function public.move_camper_to_cabin(uuid, uuid, boolean) from public, anon;
revoke execute on function public.assign_staff_to_cabin(uuid, uuid, text) from public, anon;
revoke execute on function public.promote_from_waitlist(uuid, uuid, boolean) from public, anon;

grant execute on function public.assign_camper_to_cabin(uuid) to authenticated;
grant execute on function public.move_camper_to_cabin(uuid, uuid, boolean) to authenticated;
grant execute on function public.assign_staff_to_cabin(uuid, uuid, text) to authenticated;
grant execute on function public.promote_from_waitlist(uuid, uuid, boolean) to authenticated;

-- The board needs these to show cabins in the camp's own order and name the
-- lead counselor without a second round trip.
-- Dropped rather than replaced: `create or replace view` cannot insert columns
-- ahead of existing ones.
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

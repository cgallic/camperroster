-- Roster import from a director's spreadsheet export (UltraCamp, CampMinder,
-- CampBrain, Google Forms).
--
-- The browser parses and maps the file; /api/admin/import re-validates each
-- row and calls import_roster_rows() with the caller's own JWT, so the audit
-- triggers record the real person who ran the import. Rows are matched to
-- existing records rather than duplicated:
--   guardian  by (camp_id, lower(email))
--   camper    by (camp_id, lower(first), lower(last), birth_date)
--   health    one profile per camper; blank fields are filled, set fields are never overwritten
--   session   one registration per (camper, session); no invoice or payment schedule is created
-- Additive and idempotent: nothing is dropped or rewritten.

-- ---------------------------------------------------------------------------
-- Idempotency ledger, one row per imported chunk

create table if not exists public.roster_imports (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete cascade,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 200),
  source_name text,
  actor_id uuid,
  row_count int,
  result jsonb,
  created_at timestamptz not null default now(),
  unique (camp_id, idempotency_key)
);

create index if not exists roster_imports_camp_created_idx
  on public.roster_imports (camp_id, created_at desc);

alter table public.roster_imports enable row level security;
revoke all on table public.roster_imports from public, anon, authenticated;
grant select on table public.roster_imports to authenticated;

drop policy if exists roster_imports_registrar_select on public.roster_imports;
create policy roster_imports_registrar_select on public.roster_imports
  for select to authenticated
  using (public.has_camp_role(camp_id, array['registrar']));

-- ---------------------------------------------------------------------------
-- Lookup indexes for the matching rules above (plain, not unique: existing
-- data may already hold duplicates and this migration must not fail on them)

create index if not exists guardians_camp_lower_email_idx
  on public.guardians (camp_id, lower(email));
create index if not exists campers_camp_identity_idx
  on public.campers (camp_id, lower(legal_first_name), lower(legal_last_name), birth_date);
create index if not exists registrations_camper_session_idx
  on public.registrations (camper_id, session_id);

-- ---------------------------------------------------------------------------

create or replace function public.import_roster_rows(
  p_camp_id uuid,
  p_session_id uuid,
  p_idempotency_key text,
  p_source text,
  p_rows jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing jsonb;
  v_claimed int;
  v_can_write_health boolean;
  v_row jsonb;
  v_index int := 0;
  v_family_id uuid;
  v_guardian public.guardians;
  v_guardian_id uuid;
  v_camper_id uuid;
  v_action text;
  v_changed boolean;
  v_count int;
  v_first text;
  v_last text;
  v_email text;
  v_birth date;
  v_allergies text;
  v_medications text;
  v_dietary text;
  v_epipen boolean;
  v_row_warnings jsonb;
  v_results jsonb := '[]'::jsonb;
  v_created int := 0;
  v_updated int := 0;
  v_skipped int := 0;
  v_errors int := 0;
  v_guardians_created int := 0;
  v_registrations_created int := 0;
  v_result jsonb;
begin
  if auth.uid() is null or p_camp_id is null
     or not public.has_camp_role(p_camp_id, array['registrar']) then
    raise exception 'only a director or registrar of this camp may import a roster' using errcode = '42501';
  end if;
  if char_length(coalesce(p_idempotency_key, '')) not between 8 and 200 then
    raise exception 'invalid idempotency key' using errcode = '22023';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then
    raise exception 'rows must be an array of at most 500 entries' using errcode = '22023';
  end if;

  -- Claim / store / replay, as public_intake_requests does for public intake.
  select result into v_existing
    from public.roster_imports
   where camp_id = p_camp_id and idempotency_key = p_idempotency_key;
  if found and v_existing is not null then return v_existing; end if;

  insert into public.roster_imports (camp_id, idempotency_key, source_name, actor_id, row_count)
  values (p_camp_id, p_idempotency_key, left(p_source, 200), auth.uid(), jsonb_array_length(p_rows))
  on conflict do nothing;
  get diagnostics v_claimed = row_count;
  if v_claimed = 0 then
    select result into v_existing
      from public.roster_imports
     where camp_id = p_camp_id and idempotency_key = p_idempotency_key;
    if v_existing is not null then return v_existing; end if;
    raise exception 'this import chunk is already in progress' using errcode = '40001';
  end if;

  if p_session_id is not null and not exists (
    select 1 from public.camp_sessions where id = p_session_id and camp_id = p_camp_id
  ) then
    raise exception 'session does not belong to this camp' using errcode = '23503';
  end if;

  -- Health records follow the same rule as health_profiles RLS: directors and
  -- nurses write them, registrars do not.
  v_can_write_health := public.has_camp_role(p_camp_id, array['nurse']);

  for v_row in select value from jsonb_array_elements(p_rows) loop
    v_index := v_index + 1;
    v_row_warnings := '[]'::jsonb;
    v_first := nullif(btrim(v_row->>'camper_first_name'), '');
    v_last := nullif(btrim(v_row->>'camper_last_name'), '');
    v_email := lower(nullif(btrim(v_row->>'guardian_email'), ''));
    v_birth := case when coalesce(v_row->>'camper_birth_date', '') ~ '^\d{4}-\d{2}-\d{2}$'
                    then (v_row->>'camper_birth_date')::date end;

    if v_first is null or v_last is null or v_email is null or v_birth is null then
      v_errors := v_errors + 1;
      v_results := v_results || jsonb_build_object(
        'source_row', v_row->'source_row', 'action', 'error',
        'message', 'Camper name, birth date and guardian email are required.');
      continue;
    end if;

    v_action := 'skip';

    -- Guardian ------------------------------------------------------------
    select * into v_guardian from public.guardians g
     where g.camp_id = p_camp_id and lower(g.email) = v_email
     order by g.created_at nulls last, g.id
     limit 1;

    if found then
      v_guardian_id := v_guardian.id;
      v_family_id := v_guardian.family_id;
      if v_family_id is null then
        insert into public.families (camp_id, household_name, address_line1, address_line2, city, state, zip)
        values (p_camp_id,
                concat_ws(' ', coalesce(nullif(v_guardian.last_name, ''), v_last), 'household'),
                nullif(v_guardian.address_line1, ''), v_guardian.address_line2,
                nullif(v_guardian.city, ''), nullif(v_guardian.state, ''), nullif(v_guardian.zip, ''))
        returning id into v_family_id;
        update public.guardians set family_id = v_family_id where id = v_guardian_id;
      end if;
      -- Fill blank contact details only; a value already on file wins.
      update public.guardians g set
        phone = case when btrim(g.phone) = '' then coalesce(v_row->>'guardian_phone', '') else g.phone end,
        address_line1 = case when btrim(g.address_line1) = '' then coalesce(v_row->>'guardian_address_line1', '') else g.address_line1 end,
        address_line2 = coalesce(nullif(g.address_line2, ''), nullif(v_row->>'guardian_address_line2', '')),
        city = case when btrim(g.city) = '' then coalesce(v_row->>'guardian_city', '') else g.city end,
        state = case when btrim(g.state) = '' then coalesce(v_row->>'guardian_state', '') else g.state end,
        zip = case when btrim(g.zip) = '' then coalesce(v_row->>'guardian_zip', '') else g.zip end
       where g.id = v_guardian_id
         and ((btrim(g.phone) = '' and coalesce(v_row->>'guardian_phone', '') <> '')
           or (btrim(g.address_line1) = '' and coalesce(v_row->>'guardian_address_line1', '') <> '')
           or (btrim(g.city) = '' and coalesce(v_row->>'guardian_city', '') <> '')
           or (btrim(g.state) = '' and coalesce(v_row->>'guardian_state', '') <> '')
           or (btrim(g.zip) = '' and coalesce(v_row->>'guardian_zip', '') <> ''));
      get diagnostics v_count = row_count;
      if v_count > 0 then v_action := 'update'; end if;
    else
      insert into public.families (camp_id, household_name, address_line1, address_line2, city, state, zip)
      values (p_camp_id,
              concat_ws(' ', coalesce(nullif(btrim(v_row->>'guardian_last_name'), ''), v_last), 'household'),
              nullif(v_row->>'guardian_address_line1', ''), nullif(v_row->>'guardian_address_line2', ''),
              nullif(v_row->>'guardian_city', ''), nullif(v_row->>'guardian_state', ''),
              nullif(v_row->>'guardian_zip', ''))
      returning id into v_family_id;

      insert into public.guardians
        (camp_id, family_id, first_name, last_name, email, phone, relationship,
         address_line1, address_line2, city, state, zip)
      values
        (p_camp_id, v_family_id,
         coalesce(v_row->>'guardian_first_name', ''),
         coalesce(nullif(v_row->>'guardian_last_name', ''), v_last),
         v_email,
         coalesce(v_row->>'guardian_phone', ''),
         coalesce(nullif(btrim(v_row->>'guardian_relationship'), ''), 'guardian'),
         coalesce(v_row->>'guardian_address_line1', ''),
         nullif(v_row->>'guardian_address_line2', ''),
         coalesce(v_row->>'guardian_city', ''),
         coalesce(v_row->>'guardian_state', ''),
         coalesce(v_row->>'guardian_zip', ''))
      returning id into v_guardian_id;
      v_guardians_created := v_guardians_created + 1;
      v_action := 'update';

      if coalesce(v_row->>'guardian_phone', '') = '' then
        v_row_warnings := v_row_warnings || to_jsonb('Guardian phone is blank.'::text);
      end if;
      if coalesce(v_row->>'guardian_address_line1', '') = '' or coalesce(v_row->>'guardian_city', '') = ''
         or coalesce(v_row->>'guardian_state', '') = '' or coalesce(v_row->>'guardian_zip', '') = '' then
        v_row_warnings := v_row_warnings || to_jsonb('Mailing address is incomplete.'::text);
      end if;
      if nullif(btrim(v_row->>'guardian_relationship'), '') is null then
        v_row_warnings := v_row_warnings || to_jsonb('Relationship saved as "guardian".'::text);
      end if;
    end if;

    -- Camper --------------------------------------------------------------
    select c.id into v_camper_id from public.campers c
     where c.camp_id = p_camp_id
       and lower(c.legal_first_name) = lower(v_first)
       and lower(c.legal_last_name) = lower(v_last)
       and c.birth_date = v_birth
     order by c.created_at nulls last, c.id
     limit 1;

    if v_camper_id is null then
      insert into public.campers
        (camp_id, family_id, guardian_id, legal_first_name, legal_last_name, preferred_name,
         birth_date, gender, grade_entering)
      values
        (p_camp_id, v_family_id, v_guardian_id, v_first, v_last,
         nullif(btrim(v_row->>'camper_preferred_name'), ''), v_birth,
         coalesce(v_row->>'camper_gender', ''),
         greatest(0, least(12, coalesce((v_row->>'camper_grade')::int, 0))))
      returning id into v_camper_id;
      v_action := 'create';
    else
      -- A camper imported before households existed joins the guardian's.
      update public.campers c set family_id = v_family_id
       where c.id = v_camper_id and c.family_id is null and v_family_id is not null;
      update public.campers c
         set preferred_name = nullif(btrim(v_row->>'camper_preferred_name'), '')
       where c.id = v_camper_id
         and nullif(btrim(c.preferred_name), '') is null
         and nullif(btrim(v_row->>'camper_preferred_name'), '') is not null;
      get diagnostics v_count = row_count;
      if v_count > 0 and v_action = 'skip' then v_action := 'update'; end if;
    end if;

    -- Health: insert, or fill only the blanks ----------------------------
    v_allergies := nullif(btrim(v_row->>'allergies'), '');
    v_medications := nullif(btrim(v_row->>'medications'), '');
    v_dietary := nullif(btrim(v_row->>'dietary_notes'), '');
    v_epipen := case when jsonb_typeof(v_row->'has_epipen') = 'boolean' then (v_row->>'has_epipen')::boolean end;

    if v_allergies is not null or v_medications is not null or v_dietary is not null or v_epipen is true then
      if not v_can_write_health then
        v_row_warnings := v_row_warnings || to_jsonb('Health details skipped: a registrar cannot write health records.'::text);
      else
        v_changed := false;
        insert into public.health_profiles as h
          (camp_id, camper_id, has_allergies, allergy_details, has_medications, medication_details,
           dietary_restrictions, has_epipen, immunization_status)
        values
          (p_camp_id, v_camper_id, v_allergies is not null, v_allergies, v_medications is not null,
           v_medications, v_dietary, coalesce(v_epipen, false), 'pending_review')
        on conflict (camper_id) do update set
          allergy_details = coalesce(nullif(btrim(h.allergy_details), ''), excluded.allergy_details),
          has_allergies = coalesce(h.has_allergies, false)
            or (nullif(btrim(h.allergy_details), '') is null and excluded.allergy_details is not null),
          medication_details = coalesce(nullif(btrim(h.medication_details), ''), excluded.medication_details),
          has_medications = coalesce(h.has_medications, false)
            or (nullif(btrim(h.medication_details), '') is null and excluded.medication_details is not null),
          dietary_restrictions = coalesce(nullif(btrim(h.dietary_restrictions), ''), excluded.dietary_restrictions),
          has_epipen = coalesce(h.has_epipen, false) or excluded.has_epipen,
          updated_at = now()
        where (nullif(btrim(h.allergy_details), '') is null and excluded.allergy_details is not null)
           or (nullif(btrim(h.medication_details), '') is null and excluded.medication_details is not null)
           or (nullif(btrim(h.dietary_restrictions), '') is null and excluded.dietary_restrictions is not null)
           or (coalesce(h.has_epipen, false) = false and excluded.has_epipen);
        get diagnostics v_count = row_count;
        if v_count > 0 and v_action = 'skip' then v_action := 'update'; end if;
      end if;
    end if;

    -- Registration (no invoice, no payment schedule) ---------------------
    if p_session_id is not null and not exists (
      select 1 from public.registrations r
       where r.camper_id = v_camper_id and r.session_id = p_session_id
    ) then
      insert into public.registrations (camp_id, session_id, camper_id, guardian_id, status)
      values (p_camp_id, p_session_id, v_camper_id, v_guardian_id, 'submitted');
      v_registrations_created := v_registrations_created + 1;
      if v_action = 'skip' then v_action := 'update'; end if;
    end if;

    if v_action = 'create' then v_created := v_created + 1;
    elsif v_action = 'update' then v_updated := v_updated + 1;
    else v_skipped := v_skipped + 1;
    end if;

    v_results := v_results || jsonb_build_object(
      'source_row', v_row->'source_row', 'action', v_action, 'camper_id', v_camper_id,
      'warnings', v_row_warnings);
  end loop;

  v_result := jsonb_build_object(
    'created', v_created,
    'updated', v_updated,
    'skipped', v_skipped,
    'errors', v_errors,
    'guardians_created', v_guardians_created,
    'registrations_created', v_registrations_created,
    'rows', v_results
  );
  update public.roster_imports set result = v_result
   where camp_id = p_camp_id and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.import_roster_rows(uuid, uuid, text, text, jsonb) from public, anon;
grant execute on function public.import_roster_rows(uuid, uuid, text, text, jsonb) to authenticated;

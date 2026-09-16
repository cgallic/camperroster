-- Reference data a camp needs before any of the new features do anything useful:
-- a season, the five registration windows, the paperwork each population owes,
-- and the service areas volunteers sign up for.
--
-- Idempotent -- safe to re-run. Set the two variables below and execute.
--
-- Deliberately NOT seeded: pricing tiers. Tuition is real money, and guessing a
-- family's bill is worse than showing "pricing not configured" until a director
-- enters the camp's published rates in the admin.

do $$
declare
  v_camp_slug constant text := 'camphope';
  v_year      constant int  := 2027;

  v_camp_id   uuid;
  v_season_id uuid;
  v_session_id uuid;
  v_min_grade  int;
  v_max_grade  int;
  v_grade      int;
  v_gender     text;
begin
  select id into v_camp_id from public.camps where slug = v_camp_slug;
  if v_camp_id is null then
    raise exception 'No camp with slug %', v_camp_slug;
  end if;

  -- Season ---------------------------------------------------------------------
  insert into public.seasons (camp_id, year, name, forms_due_on, early_rate_ends_on, is_active)
  values (v_camp_id, v_year, format('Summer %s', v_year),
          make_date(v_year, 7, 1),   -- every form is due by July 1
          make_date(v_year, 4, 1),   -- early rates end April 1
          true)
  on conflict (camp_id, year) do update
    set forms_due_on       = excluded.forms_due_on,
        early_rate_ends_on = excluded.early_rate_ends_on
  returning id into v_season_id;

  if v_season_id is null then
    select id into v_season_id from public.seasons where camp_id = v_camp_id and year = v_year;
  end if;

  -- Registration windows -------------------------------------------------------
  -- Returning families open first, then new families a month later. Everything
  -- goes link-only on June 1 so late registrations can still be approved
  -- individually, and closes for good on July 1.
  insert into public.registration_periods (camp_id, season_id, audience, name, opens_at, closes_at, visibility)
  values
    (v_camp_id, v_season_id, 'returning_family', 'Returning families',
     make_timestamptz(v_year, 2, 15, 0, 0, 0), make_timestamptz(v_year, 7, 1, 0, 0, 0), 'public'),
    (v_camp_id, v_season_id, 'new_family', 'New families',
     make_timestamptz(v_year, 3, 15, 0, 0, 0), make_timestamptz(v_year, 7, 1, 0, 0, 0), 'public'),
    (v_camp_id, v_season_id, 'returning_adult', 'Returning adult volunteers',
     make_timestamptz(v_year, 2, 15, 0, 0, 0), make_timestamptz(v_year, 7, 1, 0, 0, 0), 'public'),
    (v_camp_id, v_season_id, 'new_adult', 'New adult volunteers',
     make_timestamptz(v_year, 3, 15, 0, 0, 0), make_timestamptz(v_year, 7, 1, 0, 0, 0), 'public'),
    (v_camp_id, v_season_id, 'teen_volunteer', 'Teen volunteers',
     make_timestamptz(v_year, 3, 15, 0, 0, 0), make_timestamptz(v_year, 7, 1, 0, 0, 0), 'public')
  on conflict (season_id, audience) do nothing;

  -- Paperwork ------------------------------------------------------------------
  -- validity_months is null for anything good for one season only. The adult
  -- credentials carry forward, which is what drives the renewal warnings.
  insert into public.document_types
    (camp_id, code, name, applies_to, is_required, requires_upload, requires_signature, validity_months, display_order)
  values
    (v_camp_id, 'camper_medical',        'Medical form',                'camper', true,  false, true,  null, 10),
    (v_camp_id, 'camper_medication',     'Medication form',             'camper', true,  false, true,  null, 20),
    (v_camp_id, 'camper_insurance',      'Insurance card (both sides)', 'camper', true,  true,  false, null, 30),
    (v_camp_id, 'camper_liability',      'Liability form',              'camper', true,  false, true,  null, 40),
    (v_camp_id, 'camper_emergency',      'Emergency treatment waiver',  'camper', true,  false, true,  null, 50),
    (v_camp_id, 'camper_photo_release',  'Photo release',               'camper', true,  false, true,  null, 60),

    (v_camp_id, 'teen_registration',     'Registration',                'teen_volunteer', true,  false, true,  null, 10),
    (v_camp_id, 'teen_reference',        'Reference form',              'teen_volunteer', true,  true,  false, null, 20),
    (v_camp_id, 'teen_medical',          'Medical form',                'teen_volunteer', true,  false, true,  null, 30),
    (v_camp_id, 'teen_liability',        'Liability form',              'teen_volunteer', true,  false, true,  null, 40),
    (v_camp_id, 'teen_lifeguard_cert',   'Lifeguard certification',     'teen_volunteer', false, true,  false, 24,   50),

    (v_camp_id, 'adult_pgc',             'Protecting God''s Children',  'adult_volunteer', true, true,  false, 60, 10),
    (v_camp_id, 'adult_virtus',          'VIRTUS training',             'adult_volunteer', true, true,  false, 60, 20),
    (v_camp_id, 'adult_background',      'Background check',            'adult_volunteer', true, true,  false, 60, 30),
    (v_camp_id, 'adult_medical',         'Adult medical form',          'adult_volunteer', true, false, true,  null, 40),
    (v_camp_id, 'adult_medication',      'Adult medication form',       'adult_volunteer', true, false, true,  null, 50),
    (v_camp_id, 'adult_lifeguard_cert',  'Lifeguard certification',     'adult_volunteer', false, true, false, 24,  60)
  on conflict (camp_id, code) do nothing;

  -- The session and its cabins ---------------------------------------------------
  -- Every tenant-scoped row needs camp_id set or row-level security hides it from
  -- everyone, including the director. The session predates that column.
  update public.camp_sessions
     set camp_id = v_camp_id
   where camp_id is null
     and id = (select id from public.camp_sessions order by created_at limit 1);

  select id, min_grade, max_grade
    into v_session_id, v_min_grade, v_max_grade
    from public.camp_sessions
   where camp_id = v_camp_id and is_active
   order by start_date
   limit 1;

  -- One cabin per grade and gender at the camp's standard cap of 12. Without
  -- these there is nowhere to place a camper and every registration waitlists.
  -- Names and caps are a starting point; a director edits them on the cabin board.
  if v_session_id is not null then
    for v_grade in v_min_grade .. v_max_grade loop
      foreach v_gender in array array['male', 'female'] loop
        -- No unique constraint on (session, grade, gender), so the guard is
        -- explicit rather than an ON CONFLICT that would silently do nothing.
        insert into public.cabins (camp_id, session_id, name, gender, min_grade, max_grade, capacity, sort_order)
        select v_camp_id,
               v_session_id,
               format('Grade %s %s', v_grade, initcap(v_gender)),
               v_gender,
               v_grade,
               v_grade,
               12,
               v_grade * 10 + case when v_gender = 'female' then 1 else 0 end
        where not exists (
          select 1 from public.cabins
           where session_id = v_session_id
             and gender = v_gender
             and min_grade = v_grade
             and max_grade = v_grade
        );
      end loop;
    end loop;
  end if;

  -- Where volunteers serve -------------------------------------------------------
  insert into public.service_areas (camp_id, code, name, display_order)
  values
    (v_camp_id, 'service',    'Service',    10),
    (v_camp_id, 'kitchen',    'Kitchen',    20),
    (v_camp_id, 'lifeguard',  'Lifeguard',  30),
    (v_camp_id, 'nurse',      'Nurse',      40),
    (v_camp_id, 'red_shirt',  'Red shirt',  50),
    (v_camp_id, 'activities', 'Activities', 60)
  on conflict (camp_id, code) do nothing;

  -- Which events raise an alert, and to whom. auto_send stays false so drafts
  -- land in the review queue rather than going out unread.
  insert into public.notification_rules (camp_id, trigger_code, auto_send, is_enabled)
  values
    (v_camp_id, 'cabin_two_from_cap',          false, true),
    (v_camp_id, 'waitlisted',                  false, true),
    (v_camp_id, 'registration_incomplete_3d',  false, true),
    (v_camp_id, 'payment_due_soon',            false, true),
    (v_camp_id, 'payment_late',                false, true),
    (v_camp_id, 'pastoral_flag',               false, true)
  on conflict (camp_id, trigger_code) do nothing;

  raise notice 'Seeded % for season %', v_camp_slug, v_year;
end;
$$;

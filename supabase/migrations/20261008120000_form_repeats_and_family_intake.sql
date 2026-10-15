-- What admin-built forms need to carry Camp Hope's Elexio registrations
-- (GitHub issue #16). Additive only: two nullable columns, one more allowed
-- field type, and one new intake function. No rows are changed.
--
-- 1. form_fields.repeat_count_field: ask a block of questions once per unit of
--    an earlier answer ("Number of Campers" = 3 asks the camper block 3 times).
-- 2. form_definitions.success_text: the camp's own thank-you copy.
-- 3. 'radio' joins the field types: one choice, every option visible, which is
--    how long consent sentences read on a phone.
-- 4. create_form_family_intake(): one published family form submission becomes
--    a household -- family, guardian, a camper + registration per child, and the
--    form_submissions row -- in one transaction, idempotent per request key.
--    Pricing is not done here: the caller prices the family through
--    priceFamilyInvoice(), i.e. pricing_tiers via family_tuition_cents().

alter table public.form_fields
  add column if not exists repeat_count_field text;

comment on column public.form_fields.repeat_count_field is
  'field_key of an earlier number/select question. The question is asked once per unit of that answer; copy n stores its answer under <field_key>__<n>.';

alter table public.form_definitions
  add column if not exists success_text text;

comment on column public.form_definitions.success_text is
  'Shown after a successful submission. Null shows the default thank-you.';

-- Widen the type list. Same constraint name Postgres gave the inline check.
alter table public.form_fields drop constraint if exists form_fields_field_type_check;
alter table public.form_fields
  add constraint form_fields_field_type_check check (field_type in (
    'text', 'textarea', 'email', 'phone', 'number', 'date',
    'select', 'radio', 'multiselect', 'checkbox', 'file', 'signature', 'section_heading'));

create or replace function public.create_form_family_intake(
  p_camp_id uuid,
  p_form_id uuid,
  p_idempotency_key text,
  p_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing jsonb;
  v_claimed int;
  v_form public.form_definitions;
  v_period public.registration_periods;
  v_session_id uuid;
  v_family_id uuid;
  v_guardian_id uuid;
  v_camper jsonb;
  v_camper_id uuid;
  v_registration_id uuid;
  v_camper_ids uuid[] := '{}';
  v_registration_ids uuid[] := '{}';
  v_submission_id uuid;
  v_count int;
  v_result jsonb;
begin
  if p_camp_id is null or p_form_id is null then
    raise exception 'camp and form are required' using errcode = '22023';
  end if;
  if char_length(coalesce(p_idempotency_key, '')) not between 8 and 200 then
    raise exception 'invalid idempotency key' using errcode = '22023';
  end if;

  -- Same request ledger as create_registration_intake: a retried submit returns
  -- the household it already created instead of creating a second one.
  select result into v_existing
    from public.public_intake_requests
   where camp_id = p_camp_id and request_kind = 'registration'
     and idempotency_key = p_idempotency_key;
  if found and v_existing is not null then return v_existing; end if;

  insert into public.public_intake_requests (camp_id, request_kind, idempotency_key)
  values (p_camp_id, 'registration', p_idempotency_key)
  on conflict do nothing;
  get diagnostics v_claimed = row_count;
  if v_claimed = 0 then
    select result into v_existing
      from public.public_intake_requests
     where camp_id = p_camp_id and request_kind = 'registration'
       and idempotency_key = p_idempotency_key;
    if v_existing is not null then return v_existing; end if;
    raise exception 'registration request is already in progress' using errcode = '40001';
  end if;

  select * into v_form from public.form_definitions
   where id = p_form_id and camp_id = p_camp_id and published_at is not null;
  if not found then
    raise exception 'form is not published for this camp' using errcode = '22023';
  end if;

  select * into v_period from public.registration_periods where id = v_form.period_id;
  if v_period.audience not in ('new_family', 'returning_family') then
    raise exception 'form is not a family registration form' using errcode = '22023';
  end if;

  -- The form does not ask for a session; a family registers for the camp's
  -- first active week, the same one invoicing dates the last instalment from.
  select id into v_session_id from public.camp_sessions
   where camp_id = p_camp_id and is_active is true
   order by start_date
   limit 1;
  if v_session_id is null then
    raise exception 'camp has no active session' using errcode = '23503';
  end if;

  v_count := coalesce(jsonb_array_length(p_payload->'campers'), 0);
  if v_count < 1 or v_count > 10 then
    raise exception 'between 1 and 10 campers are required' using errcode = '22023';
  end if;

  insert into public.families (camp_id, household_name, address_line1, city, state, zip)
  values
    (p_camp_id,
     concat_ws(' ', p_payload#>>'{guardian,last_name}', 'household'),
     nullif(p_payload#>>'{guardian,street}', ''), nullif(p_payload#>>'{guardian,city}', ''),
     nullif(p_payload#>>'{guardian,state}', ''), nullif(p_payload#>>'{guardian,zip}', ''))
  returning id into v_family_id;

  insert into public.guardians
    (camp_id, family_id, first_name, last_name, email, phone, relationship,
     address_line1, city, state, zip)
  values
    (p_camp_id, v_family_id, p_payload#>>'{guardian,first_name}', p_payload#>>'{guardian,last_name}',
     lower(p_payload#>>'{guardian,email}'), p_payload#>>'{guardian,phone}', 'Parent / Guardian',
     p_payload#>>'{guardian,street}', p_payload#>>'{guardian,city}', p_payload#>>'{guardian,state}',
     p_payload#>>'{guardian,zip}')
  returning id into v_guardian_id;

  for v_camper in select value from jsonb_array_elements(p_payload->'campers') loop
    insert into public.campers
      (camp_id, family_id, guardian_id, legal_first_name, legal_last_name,
       birth_date, gender, grade_entering)
    values
      (p_camp_id, v_family_id, v_guardian_id, v_camper->>'first_name', v_camper->>'last_name',
       (v_camper->>'birth_date')::date, v_camper->>'gender', (v_camper->>'grade')::int)
    returning id into v_camper_id;

    -- Every camper gets a health profile for the nurse to complete, as at
    -- create_registration_intake; this form collects no medical detail itself.
    insert into public.health_profiles (camp_id, camper_id, immunization_status)
    values (p_camp_id, v_camper_id, 'pending_review');

    insert into public.registrations
      (camp_id, session_id, camper_id, guardian_id, status, step_completed,
       progress_percentage, consents_agreed, payment_plan, amount_paid_cents)
    values
      (p_camp_id, v_session_id, v_camper_id, v_guardian_id, 'submitted', 5, 100,
       coalesce(p_payload->'consents', '{}'::jsonb), 'pay_in_full', 0)
    returning id into v_registration_id;

    v_camper_ids := v_camper_ids || v_camper_id;
    v_registration_ids := v_registration_ids || v_registration_id;
  end loop;

  -- One answer sheet for the household, linked to its first registration so
  -- staff reach it from the roster; every repeated camper answer is in it.
  insert into public.form_submissions (camp_id, form_id, registration_id, answers, submitted_at)
  values (p_camp_id, p_form_id, v_registration_ids[1], coalesce(p_payload->'answers', '{}'::jsonb), now())
  returning id into v_submission_id;

  v_result := jsonb_build_object(
    'family_id', v_family_id,
    'guardian_id', v_guardian_id,
    'season_id', v_period.season_id,
    'session_id', v_session_id,
    'camper_ids', to_jsonb(v_camper_ids),
    'registration_ids', to_jsonb(v_registration_ids),
    'submission_id', v_submission_id
  );
  update public.public_intake_requests set result = v_result
   where camp_id = p_camp_id and request_kind = 'registration'
     and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.create_form_family_intake(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_form_family_intake(uuid, uuid, text, jsonb) to service_role;

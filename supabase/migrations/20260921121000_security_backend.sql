-- Security and transactional integrity for public intake and staff operations.
-- Additive/idempotent: no participant rows are deleted and no tenant ids are
-- rewritten. Apply after 20260921120000_historical_imports.sql.

-- The hosted 20260916141244 migration revoked public placement access but its
-- legacy audit-trigger hardening was never represented in that ledger entry.
-- Repeat this additive revoke in the genuinely pending migration so production
-- receives the same protection as a fresh install.
revoke execute on function public.record_audit() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public intake idempotency and atomic registration/application creation

create table if not exists public.public_intake_requests (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete cascade,
  request_kind text not null check (request_kind in ('registration', 'volunteer')),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 200),
  result jsonb,
  created_at timestamptz not null default now(),
  unique (camp_id, request_kind, idempotency_key)
);
alter table public.public_intake_requests enable row level security;
revoke all on table public.public_intake_requests from anon, authenticated;
create index if not exists public_intake_requests_camp_created_idx
  on public.public_intake_requests (camp_id, created_at desc);

create or replace function public.create_registration_intake(
  p_camp_id uuid,
  p_session_id uuid,
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
  v_session public.camp_sessions;
  v_season_id uuid;
  v_family_id uuid;
  v_guardian_id uuid;
  v_camper_id uuid;
  v_registration_id uuid;
  v_invoice_id uuid;
  v_plan text;
  v_result jsonb;
  v_installments int;
  v_i int;
  v_base_amount int;
  v_remainder int;
  v_due_on date;
  v_first_amount int;
begin
  if p_camp_id is null or p_session_id is null then
    raise exception 'camp and session are required' using errcode = '22023';
  end if;
  if char_length(coalesce(p_idempotency_key, '')) not between 8 and 200 then
    raise exception 'invalid idempotency key' using errcode = '22023';
  end if;

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

  select * into v_session from public.camp_sessions
   where id = p_session_id and camp_id = p_camp_id and is_active is true;
  if not found then
    raise exception 'session is not active for this camp' using errcode = '23503';
  end if;

  select id into v_season_id from public.seasons
   where camp_id = p_camp_id and is_active is true
   order by year desc limit 1;
  if v_season_id is null then
    raise exception 'camp has no active season' using errcode = '23503';
  end if;

  v_plan := case coalesce(p_payload->>'payment_plan', '')
    when 'pay_in_full' then 'pay_in_full'
    when 'two_payments' then 'two_payments'
    when 'deposit_only' then 'two_payments'
    when 'monthly' then 'monthly'
    when 'installment' then 'monthly'
    when 'installment_3mo' then 'monthly'
    else 'monthly'
  end;

  insert into public.families
    (camp_id, household_name, address_line1, city, state, zip)
  values
    (p_camp_id,
     concat_ws(' ', p_payload->>'parent_last_name', 'household'),
     nullif(p_payload->>'parent_street', ''), nullif(p_payload->>'parent_city', ''),
     nullif(p_payload->>'parent_state', ''), nullif(p_payload->>'parent_zip', ''))
  returning id into v_family_id;

  insert into public.guardians
    (camp_id, family_id, first_name, last_name, email, phone, relationship,
     address_line1, city, state, zip)
  values
    (p_camp_id, v_family_id, p_payload->>'parent_first_name', p_payload->>'parent_last_name',
     lower(p_payload->>'parent_email'), p_payload->>'parent_phone', p_payload->>'relationship',
     p_payload->>'parent_street', p_payload->>'parent_city', p_payload->>'parent_state',
     p_payload->>'parent_zip')
  returning id into v_guardian_id;

  insert into public.campers
    (camp_id, family_id, guardian_id, legal_first_name, legal_last_name,
     birth_date, gender, grade_entering)
  values
    (p_camp_id, v_family_id, v_guardian_id, p_payload->>'camper_first_name',
     p_payload->>'camper_last_name', (p_payload->>'camper_dob')::date,
     p_payload->>'camper_gender', (p_payload->>'camper_grade')::int)
  returning id into v_camper_id;

  insert into public.health_profiles
    (camp_id, camper_id, has_allergies, allergy_details, has_epipen, epipen_location,
     dietary_restrictions, medical_conditions, physician_name, physician_phone,
     immunization_status, special_care_notes)
  values
    (p_camp_id, v_camper_id, coalesce((p_payload->>'peanut_allergy')::boolean, false),
     case when coalesce((p_payload->>'peanut_allergy')::boolean, false)
       then 'Peanut / nut allergy reported by guardian at registration.' end,
     coalesce((p_payload->>'epipen')::boolean, false),
     case when coalesce((p_payload->>'epipen')::boolean, false)
       then 'Reported at registration — confirm storage location at check-in.' end,
     nullif(p_payload->>'dietary_restrictions', ''), nullif(p_payload->>'medical_conditions', ''),
     nullif(p_payload->>'physician_name', ''), nullif(p_payload->>'physician_phone', ''),
     'pending_review', case when coalesce((p_payload->>'inhaler')::boolean, false)
       then 'Camper carries an inhaler.' end);

  if nullif(p_payload->>'insurance_carrier', '') is not null
     and nullif(p_payload->>'policy_number', '') is not null then
    insert into public.insurance_policies
      (camp_id, camper_id, insurance_company, policyholder_name,
       relationship_to_camper, member_id, group_number, status)
    values
      (p_camp_id, v_camper_id, p_payload->>'insurance_carrier',
       concat_ws(' ', p_payload->>'parent_first_name', p_payload->>'parent_last_name'),
       p_payload->>'relationship', p_payload->>'policy_number',
       nullif(p_payload->>'group_number', ''), 'pending_review');
  end if;

  insert into public.registrations
    (camp_id, session_id, camper_id, guardian_id, status, step_completed,
     progress_percentage, consents_agreed, signed_by, signed_at, buddy_requests,
     payment_plan, total_tuition_cents, amount_paid_cents)
  values
    (p_camp_id, p_session_id, v_camper_id, v_guardian_id, 'submitted', 5, 100,
     jsonb_build_object('emergency_medical', true, 'waterfront_swimming', true),
     p_payload->>'signature', now(),
     case when nullif(p_payload->>'cabin_buddy', '') is null then '{}'::text[]
       else array[p_payload->>'cabin_buddy'] end,
     v_plan, v_session.price_cents, 0)
  returning id into v_registration_id;

  insert into public.family_invoices
    (camp_id, season_id, family_id, camper_count, tier_cents, payment_plan)
  values (p_camp_id, v_season_id, v_family_id, 1, v_session.price_cents, v_plan)
  returning id into v_invoice_id;

  -- Build the first payable schedule inside the same transaction. Checkout
  -- never falls back to charging the full balance for a monthly/deposit plan.
  if v_plan = 'pay_in_full' then
    insert into public.payment_schedule_items (camp_id, invoice_id, due_on, amount_cents)
    values (p_camp_id, v_invoice_id, current_date, v_session.price_cents);
  elsif v_plan = 'two_payments' then
    v_first_amount := least(v_session.price_cents,
      case when v_session.deposit_cents > 0 then v_session.deposit_cents
           else (v_session.price_cents + 1) / 2 end);
    insert into public.payment_schedule_items (camp_id, invoice_id, due_on, amount_cents)
    values (p_camp_id, v_invoice_id, current_date, v_first_amount);
    if v_session.price_cents > v_first_amount then
      insert into public.payment_schedule_items (camp_id, invoice_id, due_on, amount_cents)
      values (p_camp_id, v_invoice_id, greatest(current_date, v_session.start_date - 1),
              v_session.price_cents - v_first_amount);
    end if;
  else
    v_installments := greatest(1, least(12,
      (extract(year from age(v_session.start_date, current_date))::int * 12)
      + extract(month from age(v_session.start_date, current_date))::int + 1));
    v_base_amount := v_session.price_cents / v_installments;
    v_remainder := v_session.price_cents % v_installments;
    for v_i in 0..v_installments - 1 loop
      v_due_on := least((current_date + (v_i || ' months')::interval)::date, v_session.start_date - 1);
      insert into public.payment_schedule_items (camp_id, invoice_id, due_on, amount_cents)
      values (p_camp_id, v_invoice_id, greatest(current_date, v_due_on),
              v_base_amount + case when v_i < v_remainder then 1 else 0 end);
    end loop;
  end if;

  v_result := jsonb_build_object(
    'registration_id', v_registration_id,
    'camper_id', v_camper_id,
    'invoice_id', v_invoice_id,
    'family_id', v_family_id,
    'tuition_cents', v_session.price_cents,
    'deposit_cents', v_session.deposit_cents,
    'payment_plan', v_plan
  );
  update public.public_intake_requests set result = v_result
   where camp_id = p_camp_id and request_kind = 'registration'
     and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

create or replace function public.create_volunteer_intake(
  p_camp_id uuid,
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
  v_application_id uuid;
  v_reference_id uuid;
  v_result jsonb;
begin
  if p_camp_id is null or char_length(coalesce(p_idempotency_key, '')) not between 8 and 200 then
    raise exception 'camp and valid idempotency key are required' using errcode = '22023';
  end if;
  select result into v_existing from public.public_intake_requests
   where camp_id = p_camp_id and request_kind = 'volunteer'
     and idempotency_key = p_idempotency_key;
  if found and v_existing is not null then return v_existing; end if;
  insert into public.public_intake_requests (camp_id, request_kind, idempotency_key)
  values (p_camp_id, 'volunteer', p_idempotency_key) on conflict do nothing;
  get diagnostics v_claimed = row_count;
  if v_claimed = 0 then
    select result into v_existing from public.public_intake_requests
     where camp_id = p_camp_id and request_kind = 'volunteer'
       and idempotency_key = p_idempotency_key;
    if v_existing is not null then return v_existing; end if;
    raise exception 'volunteer request is already in progress' using errcode = '40001';
  end if;

  insert into public.staff_applications
    (camp_id, first_name, last_name, email, phone, birth_date, role_applied, status)
  values
    (p_camp_id, p_payload->>'first_name', p_payload->>'last_name', lower(p_payload->>'email'),
     p_payload->>'phone', (p_payload->>'birth_date')::date, p_payload->>'role', 'references_pending')
  returning id into v_application_id;
  insert into public.staff_references
    (camp_id, application_id, reference_name, relationship, phone, email, status)
  values
    (p_camp_id, v_application_id, p_payload->>'reference_name', p_payload->>'reference_relationship',
     p_payload->>'reference_phone', lower(p_payload->>'reference_email'), 'call_scheduled')
  returning id into v_reference_id;
  v_result := jsonb_build_object('application_id', v_application_id, 'reference_id', v_reference_id);
  update public.public_intake_requests set result = v_result
   where camp_id = p_camp_id and request_kind = 'volunteer'
     and idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke all on function public.create_registration_intake(uuid, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.create_volunteer_intake(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_registration_intake(uuid, uuid, text, jsonb) to service_role;
grant execute on function public.create_volunteer_intake(uuid, text, jsonb) to service_role;

create or replace function public.record_kaicalls_reference_result(
  p_reference_id uuid,
  p_call_type text,
  p_caller_phone text,
  p_recipient_phone text,
  p_duration_seconds int,
  p_summary text,
  p_transcript text,
  p_sentiment_score numeric
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reference public.staff_references;
  v_log_id uuid;
begin
  select * into v_reference from public.staff_references where id = p_reference_id for update;
  if not found then raise exception 'staff reference not found' using errcode = 'P0002'; end if;
  if v_reference.camp_id is null then raise exception 'staff reference has no camp' using errcode = '23502'; end if;
  if v_reference.status = 'completed' and v_reference.kaicalls_call_id is not null then
    return jsonb_build_object('log_id', v_reference.kaicalls_call_id, 'camp_id', v_reference.camp_id, 'duplicate', true);
  end if;
  insert into public.kaicalls_logs
    (camp_id, call_type, caller_phone, recipient_phone, duration_seconds, summary, full_transcript, status)
  values
    (v_reference.camp_id, coalesce(nullif(p_call_type, ''), 'outbound_reference'),
     coalesce(nullif(p_caller_phone, ''), 'unknown'), coalesce(nullif(p_recipient_phone, ''), 'unknown'),
     p_duration_seconds, p_summary, p_transcript, 'completed')
  returning id into v_log_id;
  update public.staff_references
     set status = 'completed', kaicalls_call_id = v_log_id, call_transcript = p_transcript,
         sentiment_score = p_sentiment_score, verified_at = now()
   where id = p_reference_id;
  return jsonb_build_object('log_id', v_log_id, 'camp_id', v_reference.camp_id, 'duplicate', false);
end;
$$;
revoke all on function public.record_kaicalls_reference_result(uuid,text,text,text,int,text,text,numeric)
  from public, anon, authenticated;
grant execute on function public.record_kaicalls_reference_result(uuid,text,text,text,int,text,text,numeric)
  to service_role;

-- ---------------------------------------------------------------------------
-- Medical decisions preserve care notes and name the reviewer.

alter table public.health_profiles
  add column if not exists immunization_reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists immunization_reviewed_at timestamptz,
  add column if not exists immunization_review_note text;

update public.health_profiles
   set immunization_status = 'pending_review'
 where immunization_status = 'approved' and immunization_reviewed_by is null;

alter table public.health_profiles drop constraint if exists health_profiles_immunization_review_ck;
alter table public.health_profiles add constraint health_profiles_immunization_review_ck
  check (
    immunization_status not in ('approved', 'rejected')
    or (immunization_reviewed_by is not null and immunization_reviewed_at is not null)
  );

create or replace function public.enforce_health_review_actor()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.immunization_status is distinct from old.immunization_status
     and new.immunization_status in ('approved', 'rejected') then
    if auth.uid() is null then raise exception 'medical decision requires an authenticated reviewer' using errcode = '42501'; end if;
    new.immunization_reviewed_by := auth.uid();
    new.immunization_reviewed_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_health_review_actor on public.health_profiles;
create trigger enforce_health_review_actor before update on public.health_profiles
  for each row execute function public.enforce_health_review_actor();
revoke execute on function public.enforce_health_review_actor() from public, anon, authenticated;

create or replace function public.enforce_reference_review_actor()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.safety_approved is distinct from old.safety_approved and new.safety_approved is not null then
    if auth.uid() is null then raise exception 'safety decision requires an authenticated reviewer' using errcode = '42501'; end if;
    new.safety_reviewed_by := auth.uid();
    new.safety_reviewed_at := now();
    new.director_reviewed := true;
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_reference_review_actor on public.staff_references;
create trigger enforce_reference_review_actor before update on public.staff_references
  for each row execute function public.enforce_reference_review_actor();
revoke execute on function public.enforce_reference_review_actor() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Atomic, idempotent, audited canteen and check-in mutations.

create table if not exists public.canteen_wallet_entries (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  amount_cents int not null check (amount_cents <> 0),
  balance_after_cents int not null check (balance_after_cents >= 0),
  note text,
  actor_id uuid not null references auth.users(id) on delete restrict,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 200),
  created_at timestamptz not null default now(),
  unique (camp_id, idempotency_key)
);
create index if not exists canteen_wallet_entries_registration_idx
  on public.canteen_wallet_entries (registration_id, created_at desc);
create index if not exists canteen_wallet_entries_actor_idx
  on public.canteen_wallet_entries (actor_id);
alter table public.canteen_wallet_entries enable row level security;
drop policy if exists canteen_wallet_entries_staff_select on public.canteen_wallet_entries;
create policy canteen_wallet_entries_staff_select on public.canteen_wallet_entries
  for select to authenticated
  using (public.has_camp_role(camp_id, array['registrar','staff','counselor']));

create or replace function public.mutate_canteen_wallet(
  p_registration_id uuid,
  p_amount_cents int,
  p_idempotency_key text,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.registrations;
  v_existing public.canteen_wallet_entries;
  v_balance int;
begin
  if p_amount_cents = 0 or p_amount_cents not between -100000 and 100000 then
    raise exception 'amount must be non-zero and no more than $1,000' using errcode = '22023';
  end if;
  if char_length(coalesce(p_idempotency_key, '')) not between 8 and 200 then
    raise exception 'invalid idempotency key' using errcode = '22023';
  end if;
  select * into v_registration from public.registrations where id = p_registration_id for update;
  if not found then raise exception 'registration not found' using errcode = 'P0002'; end if;
  if not public.has_camp_role(v_registration.camp_id, array['registrar','staff','counselor']) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into v_existing from public.canteen_wallet_entries
   where camp_id = v_registration.camp_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.registration_id <> p_registration_id or v_existing.amount_cents <> p_amount_cents then
      raise exception 'idempotency key already used for another mutation' using errcode = '23505';
    end if;
    return jsonb_build_object('entry_id', v_existing.id, 'new_balance_cents', v_existing.balance_after_cents);
  end if;
  v_balance := coalesce(v_registration.canteen_balance_cents, 0) + p_amount_cents;
  if v_balance < 0 then raise exception 'wallet would be overdrawn' using errcode = '23514'; end if;
  update public.registrations set canteen_balance_cents = v_balance, updated_at = now()
   where id = p_registration_id;
  insert into public.canteen_wallet_entries
    (camp_id, registration_id, amount_cents, balance_after_cents, note, actor_id, idempotency_key)
  values
    (v_registration.camp_id, p_registration_id, p_amount_cents, v_balance,
     nullif(p_note, ''), auth.uid(), p_idempotency_key)
  returning id into v_existing.id;
  return jsonb_build_object('entry_id', v_existing.id, 'new_balance_cents', v_balance);
end;
$$;

create or replace function public.set_registration_checkin(
  p_registration_id uuid,
  p_checked_in boolean
) returns public.registrations
language plpgsql
security definer
set search_path = ''
as $$
declare v_registration public.registrations;
begin
  select * into v_registration from public.registrations where id = p_registration_id for update;
  if not found then raise exception 'registration not found' using errcode = 'P0002'; end if;
  if not public.has_camp_role(v_registration.camp_id, array['registrar','staff']) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.registrations
     set checked_in = p_checked_in,
         checked_in_at = case when p_checked_in then now() else null end,
         updated_at = now()
   where id = p_registration_id returning * into v_registration;
  return v_registration;
end;
$$;
revoke all on function public.mutate_canteen_wallet(uuid, int, text, text) from public, anon;
revoke all on function public.set_registration_checkin(uuid, boolean) from public, anon;
grant execute on function public.mutate_canteen_wallet(uuid, int, text, text) to authenticated;
grant execute on function public.set_registration_checkin(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Staff invitation lifecycle. Tokens are stored only as SHA-256 hashes.

create table if not exists public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete cascade,
  email text not null,
  role text not null check (role in ('director','registrar','nurse','red_shirt','counselor','staff')),
  token_sha256 text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  invited_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz
);
create index if not exists staff_invitations_camp_status_idx
  on public.staff_invitations (camp_id, status, invited_at desc);
create index if not exists staff_invitations_invited_by_idx on public.staff_invitations (invited_by);
create index if not exists staff_invitations_accepted_by_idx on public.staff_invitations (accepted_by);
alter table public.staff_invitations enable row level security;
drop policy if exists staff_invitations_director_select on public.staff_invitations;
create policy staff_invitations_director_select on public.staff_invitations
  for select to authenticated using (public.is_camp_director(camp_id));
drop trigger if exists audit_staff_invitations on public.staff_invitations;
create trigger audit_staff_invitations after insert or update or delete on public.staff_invitations
  for each row execute function public.record_audit();

create or replace function public.accept_staff_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.staff_invitations;
  v_email text;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into v_invite from public.staff_invitations
   where token_sha256 = encode(extensions.digest(p_token, 'sha256'), 'hex')
   for update;
  if not found or v_invite.status <> 'pending' or v_invite.expires_at <= now() then
    raise exception 'invitation is invalid or expired' using errcode = '22023';
  end if;
  select lower(email) into v_email from auth.users where id = auth.uid();
  if v_email is distinct from lower(v_invite.email) then
    raise exception 'invitation belongs to another email address' using errcode = '42501';
  end if;
  insert into public.camp_members (camp_id, user_id, role)
  values (v_invite.camp_id, auth.uid(), v_invite.role)
  on conflict (camp_id, user_id) do update set role = excluded.role;
  update public.staff_invitations set status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
   where id = v_invite.id;
  return jsonb_build_object('camp_id', v_invite.camp_id, 'role', v_invite.role);
end;
$$;
revoke all on function public.accept_staff_invitation(text) from public, anon;
grant execute on function public.accept_staff_invitation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Replace the broad "any member can do anything" policies from 0001.

do $$
declare t text;
begin
  foreach t in array array['registrations','campers','guardians','health_profiles',
    'insurance_policies','staff_applications','staff_references','kaicalls_logs'] loop
    execute format('drop policy if exists %I on public.%I', t || '_member_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_member_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_member_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_member_delete', t);
  end loop;
end $$;

create policy registrations_operations_select on public.registrations for select to authenticated
  using (public.has_camp_role(camp_id, array['registrar','nurse','counselor','staff']));
create policy registrations_registrar_write on public.registrations for all to authenticated
  using (public.has_camp_role(camp_id, array['registrar']))
  with check (public.has_camp_role(camp_id, array['registrar']));

create policy campers_operations_select on public.campers for select to authenticated
  using (public.has_camp_role(camp_id, array['registrar','nurse','counselor','staff']));
create policy campers_registrar_write on public.campers for all to authenticated
  using (public.has_camp_role(camp_id, array['registrar']))
  with check (public.has_camp_role(camp_id, array['registrar']));

create policy guardians_need_to_know_select on public.guardians for select to authenticated
  using (public.has_camp_role(camp_id, array['registrar','nurse']));
create policy guardians_registrar_write on public.guardians for all to authenticated
  using (public.has_camp_role(camp_id, array['registrar']))
  with check (public.has_camp_role(camp_id, array['registrar']));

create policy health_profiles_nurse_select on public.health_profiles for select to authenticated
  using (public.has_camp_role(camp_id, array['nurse']));
create policy health_profiles_nurse_write on public.health_profiles for all to authenticated
  using (public.has_camp_role(camp_id, array['nurse']))
  with check (public.has_camp_role(camp_id, array['nurse']));

create policy insurance_clinical_select on public.insurance_policies for select to authenticated
  using (public.has_camp_role(camp_id, array['nurse','registrar']));
create policy insurance_clinical_write on public.insurance_policies for all to authenticated
  using (public.has_camp_role(camp_id, array['nurse','registrar']))
  with check (public.has_camp_role(camp_id, array['nurse','registrar']));

create policy staff_applications_safety_select on public.staff_applications for select to authenticated
  using (public.has_camp_role(camp_id, array['red_shirt','registrar']));
create policy staff_applications_safety_write on public.staff_applications for all to authenticated
  using (public.has_camp_role(camp_id, array['red_shirt','registrar']))
  with check (public.has_camp_role(camp_id, array['red_shirt','registrar']));
create policy staff_references_safety_select on public.staff_references for select to authenticated
  using (public.has_camp_role(camp_id, array['red_shirt','registrar']));
create policy staff_references_safety_write on public.staff_references for all to authenticated
  using (public.has_camp_role(camp_id, array['red_shirt','registrar']))
  with check (public.has_camp_role(camp_id, array['red_shirt','registrar']));
create policy kaicalls_logs_safety_select on public.kaicalls_logs for select to authenticated
  using (public.has_camp_role(camp_id, array['red_shirt','registrar']));

drop policy if exists camp_members_self_or_camp_select on public.camp_members;
create policy camp_members_self_or_director_select on public.camp_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_camp_director(camp_id));

-- Direct table grants remain narrow; the public routes use service-role RPCs.
revoke insert, update, delete on public.canteen_wallet_entries from authenticated;
revoke insert, update, delete on public.staff_invitations from authenticated;

notify pgrst, 'reload schema';

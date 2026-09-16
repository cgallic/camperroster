-- Roles the camp actually staffs, plus a tamper-evident record of who changed what.
--
-- Builds on the tenancy and billing schema in 0001-0003: camps, camp_members,
-- and the RLS helpers is_camp_member/is_camp_director all come from there.

-- 1. Widen the role vocabulary -------------------------------------------------
-- 'registrar' processes registrations; 'red_shirt' is the safety/compliance team
-- that clears background checks. Both were being done by 'director' accounts.
alter table public.camp_members drop constraint if exists camp_members_role_check;
alter table public.camp_members add constraint camp_members_role_check
  check (role in ('director', 'registrar', 'nurse', 'red_shirt', 'counselor', 'staff'));

create or replace function public.has_camp_role(p_camp_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.camp_members m
    where m.camp_id = p_camp_id
      and m.user_id = auth.uid()
      -- Directors hold every permission, so they never need listing explicitly.
      and (m.role = 'director' or m.role = any(p_roles))
  );
$$;

-- 2. Audit log ----------------------------------------------------------------
create table if not exists public.audit_log (
  id           bigserial primary key,
  camp_id      uuid references public.camps(id) on delete cascade,
  table_name   text        not null,
  record_id    uuid,
  action       text        not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id     uuid,
  actor_email  text,
  -- Only the columns that actually differ, to keep this readable and small.
  changed      jsonb       not null default '{}'::jsonb,
  occurred_at  timestamptz not null default now()
);

create index if not exists audit_log_camp_time_idx on public.audit_log (camp_id, occurred_at desc);
create index if not exists audit_log_record_idx    on public.audit_log (table_name, record_id);

comment on table public.audit_log is
  'Append-only history of changes to participant data. No update or delete policy exists, so rows cannot be altered through the API.';

create or replace function public.record_audit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old     jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
  v_new     jsonb := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;
  v_changed jsonb;
  v_record  record;
begin
  v_record := coalesce(new, old);

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(key, jsonb_build_object('from', v_old -> key, 'to', v_new -> key)), '{}'::jsonb)
      into v_changed
      from jsonb_object_keys(v_new) as key
     where v_old -> key is distinct from v_new -> key;

    -- A no-op update is noise, not history.
    if v_changed = '{}'::jsonb then
      return new;
    end if;
  else
    v_changed := case when tg_op = 'INSERT' then v_new else v_old end;
  end if;

  insert into public.audit_log (camp_id, table_name, record_id, action, actor_id, actor_email, changed)
  values (
    (to_jsonb(v_record) ->> 'camp_id')::uuid,
    tg_table_name,
    (to_jsonb(v_record) ->> 'id')::uuid,
    tg_op,
    auth.uid(),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email',
    v_changed
  );

  return coalesce(new, old);
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'campers', 'guardians', 'health_profiles', 'insurance_policies',
    'registrations', 'staff_applications', 'staff_references', 'cabins', 'camp_members'
  ] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
    execute format(
      'create trigger audit_%1$s after insert or update or delete on public.%1$I
         for each row execute function public.record_audit()', t);
  end loop;
end;
$$;

-- Readable by the camp's leadership only; never writable through the API.
alter table public.audit_log enable row level security;

drop policy if exists audit_log_leadership_select on public.audit_log;
create policy audit_log_leadership_select on public.audit_log
  for select to authenticated
  using (public.has_camp_role(camp_id, array['registrar']));

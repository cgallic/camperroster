-- Admin-editable registration forms.
--
-- The five audiences each want their own questions, and the camp wants to change
-- those questions without waiting on a deploy. So fields are rows, not JSX, and
-- a form is versioned: editing a published form creates a new version rather
-- than mutating the one people already answered.

create table if not exists public.registration_periods (
  id           uuid primary key default gen_random_uuid(),
  camp_id      uuid not null references public.camps(id) on delete cascade,
  season_id    uuid not null references public.seasons(id) on delete cascade,
  audience     text not null check (audience in (
                 'returning_family', 'new_family',
                 'returning_adult', 'new_adult', 'teen_volunteer')),
  name         text not null,
  opens_at     timestamptz,
  closes_at    timestamptz,
  -- 'link_only' keeps a form reachable for approved late registrations after the
  -- public listing closes; the token is the whole secret, so it is never listed.
  visibility   text not null default 'public' check (visibility in ('public', 'link_only', 'closed')),
  access_token text unique,
  created_at   timestamptz not null default now(),
  unique (season_id, audience)
);

create or replace function public.registration_period_is_open(p_period public.registration_periods)
returns boolean
language sql
immutable
as $$
  select p_period.visibility <> 'closed'
     and (p_period.opens_at  is null or now() >= p_period.opens_at)
     and (p_period.closes_at is null or now() <  p_period.closes_at);
$$;

create table if not exists public.form_definitions (
  id           uuid primary key default gen_random_uuid(),
  camp_id      uuid not null references public.camps(id) on delete cascade,
  period_id    uuid not null references public.registration_periods(id) on delete cascade,
  version      int  not null default 1,
  title        text not null,
  intro_text   text,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (period_id, version)
);

-- At most one published version per period, so intake never has to pick.
create unique index if not exists form_definitions_one_live_idx
  on public.form_definitions (period_id) where published_at is not null;

create table if not exists public.form_fields (
  id            uuid primary key default gen_random_uuid(),
  camp_id       uuid not null references public.camps(id) on delete cascade,
  form_id       uuid not null references public.form_definitions(id) on delete cascade,
  -- Stable key used in the answers jsonb; renaming the label must not orphan data.
  field_key     text not null,
  label         text not null,
  help_text     text,
  field_type    text not null check (field_type in (
                  'text', 'textarea', 'email', 'phone', 'number', 'date',
                  'select', 'multiselect', 'checkbox', 'file', 'signature', 'section_heading')),
  required      boolean not null default false,
  options       jsonb   not null default '[]'::jsonb,
  -- Conditional display, e.g. {"field":"grade","op":"gte","value":9} to ask
  -- high-schoolers for a reference. Null means always shown.
  visible_when  jsonb,
  -- Groups related questions ("all doctor parts in the same section").
  section       text,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  unique (form_id, field_key)
);

create index if not exists form_fields_form_order_idx on public.form_fields (form_id, display_order);

create table if not exists public.form_submissions (
  id                   uuid primary key default gen_random_uuid(),
  camp_id              uuid not null references public.camps(id) on delete cascade,
  form_id              uuid not null references public.form_definitions(id) on delete restrict,
  registration_id      uuid references public.registrations(id) on delete cascade,
  staff_application_id uuid references public.staff_applications(id) on delete cascade,
  answers              jsonb not null default '{}'::jsonb,
  submitted_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists form_submissions_registration_idx on public.form_submissions (registration_id);
create index if not exists form_submissions_staff_idx        on public.form_submissions (staff_application_id);

-- Policies ---------------------------------------------------------------------
alter table public.registration_periods enable row level security;
alter table public.form_definitions     enable row level security;
alter table public.form_fields          enable row level security;
alter table public.form_submissions     enable row level security;

do $$
declare
  t text;
begin
  -- Staff read; registrars and directors edit. Public intake reaches these
  -- through the service role, which RLS does not apply to.
  foreach t in array array['registration_periods', 'form_definitions', 'form_fields', 'form_submissions'] loop
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

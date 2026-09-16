-- Seasons, households, and participation history.
--
-- Two asks drive this migration. "Family information reduplicated between
-- siblings automatically" needs a household row that guardians and campers both
-- hang off, so a second child inherits the first one's address and contacts.
-- "New vs. returning" needs a record of who actually attended in prior years,
-- which nothing in the schema captured.

create table if not exists public.seasons (
  id                 uuid primary key default gen_random_uuid(),
  camp_id            uuid not null references public.camps(id) on delete cascade,
  year               int  not null,
  name               text not null,
  -- Deadlines the registration status machine reads. Defaults match Camp Hope's
  -- published dates; each camp can move them without a code change.
  forms_due_on       date not null,
  early_rate_ends_on date not null,
  is_active          boolean not null default false,
  created_at         timestamptz not null default now(),
  unique (camp_id, year)
);

comment on column public.seasons.forms_due_on is
  'After this date an incomplete registration reports as "overdue" rather than "pending".';

create table if not exists public.families (
  id            uuid primary key default gen_random_uuid(),
  camp_id       uuid not null references public.camps(id) on delete cascade,
  household_name text not null,
  address_line1 text,
  address_line2 text,
  city          text,
  state         text,
  zip           text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.families is
  'Household root. Siblings share one row, so address and guardian details are entered once.';

alter table public.guardians add column if not exists family_id uuid references public.families(id) on delete set null;
alter table public.campers   add column if not exists family_id uuid references public.families(id) on delete set null;

create index if not exists guardians_family_idx on public.guardians (family_id);
create index if not exists campers_family_idx   on public.campers (family_id);

-- Participation history --------------------------------------------------------
-- One row per person per season they took part. Presence of a prior row is what
-- makes someone "returning"; self-identification on the form is only a hint.
create table if not exists public.participant_history (
  id                   uuid primary key default gen_random_uuid(),
  camp_id              uuid not null references public.camps(id) on delete cascade,
  season_id            uuid not null references public.seasons(id) on delete cascade,
  participant_type     text not null check (participant_type in ('camper', 'teen_volunteer', 'adult_volunteer')),
  camper_id            uuid references public.campers(id) on delete cascade,
  staff_application_id uuid references public.staff_applications(id) on delete cascade,
  grade_completed      int,
  attended             boolean not null default true,
  created_at           timestamptz not null default now(),
  -- Exactly one subject, matching the declared type.
  constraint participant_history_subject_ck check (
    (participant_type = 'camper' and camper_id is not null and staff_application_id is null)
    or (participant_type <> 'camper' and staff_application_id is not null and camper_id is null)
  )
);

create unique index if not exists participant_history_camper_season_idx
  on public.participant_history (season_id, camper_id) where camper_id is not null;
create unique index if not exists participant_history_staff_season_idx
  on public.participant_history (season_id, staff_application_id) where staff_application_id is not null;

-- Policies ---------------------------------------------------------------------
-- An rls_auto_enable event trigger turns RLS on for new tables, so each needs
-- explicit policies or it stays unreachable.
alter table public.seasons             enable row level security;
alter table public.families            enable row level security;
alter table public.participant_history enable row level security;

drop policy if exists seasons_member_select on public.seasons;
create policy seasons_member_select on public.seasons
  for select to authenticated using (public.is_camp_member(camp_id));

drop policy if exists seasons_director_write on public.seasons;
create policy seasons_director_write on public.seasons
  for all to authenticated
  using (public.is_camp_director(camp_id))
  with check (public.is_camp_director(camp_id));

drop policy if exists families_member_select on public.families;
create policy families_member_select on public.families
  for select to authenticated using (public.is_camp_member(camp_id));

drop policy if exists families_registrar_write on public.families;
create policy families_registrar_write on public.families
  for all to authenticated
  using (public.has_camp_role(camp_id, array['registrar']))
  with check (public.has_camp_role(camp_id, array['registrar']));

drop policy if exists participant_history_member_select on public.participant_history;
create policy participant_history_member_select on public.participant_history
  for select to authenticated using (public.is_camp_member(camp_id));

drop policy if exists participant_history_registrar_write on public.participant_history;
create policy participant_history_registrar_write on public.participant_history
  for all to authenticated
  using (public.has_camp_role(camp_id, array['registrar']))
  with check (public.has_camp_role(camp_id, array['registrar']));

-- Historical source registrations are deliberately separate from live enrollment,
-- attendance, medical clearance, consent, and payment balances.
begin;
create table if not exists public.camp_registration_imports (
  id uuid primary key,
  camp_id uuid not null references public.camps(id),
  season_year integer not null check (season_year between 1900 and 2200),
  participant_type text not null check (participant_type in ('camper','adult_volunteer','teen_volunteer')),
  source_registration_id text,
  first_name text not null,
  last_name text not null,
  source_status text,
  source_workbook text not null,
  source_sheet text not null,
  source_row integer not null,
  source_sha256 text not null,
  source_data jsonb not null,
  imported_at timestamptz not null default now()
);
comment on table public.camp_registration_imports is 'Private historical registration sources, not proof of attendance or current enrollment. Source fields may be incomplete or contain historical workbook errors.';
create index if not exists camp_registration_imports_camp_year on public.camp_registration_imports(camp_id,season_year);
alter table public.camp_registration_imports enable row level security;
revoke all on public.camp_registration_imports from public, anon, authenticated;
grant select on public.camp_registration_imports to authenticated;
grant all on public.camp_registration_imports to service_role;
drop policy if exists historical_roster_director_read on public.camp_registration_imports;
create policy historical_roster_director_read on public.camp_registration_imports
 for select to authenticated using (public.is_camp_director(camp_id));
notify pgrst, 'reload schema';
commit;

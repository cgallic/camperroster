-- Core tables that pre-date the checked-in migration history.
--
-- The original repository assumed these tables had been created in the
-- Supabase dashboard.  That made a clean database impossible to reproduce.
-- This migration is deliberately conservative: CREATE TABLE IF NOT EXISTS
-- leaves the live database untouched while giving a fresh database the base
-- schema required by 0001 and later additive migrations.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.camps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  director_name text not null,
  director_email text not null,
  director_phone text,
  location text,
  logo_url text,
  primary_color text,
  created_at timestamptz not null default now()
);

create table if not exists public.guardians (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  relationship text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  zip text not null,
  auth_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.campers (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  legal_first_name text not null,
  legal_last_name text not null,
  preferred_name text,
  birth_date date not null,
  gender text not null,
  grade_entering int not null,
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists public.camp_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  name text not null,
  start_date date not null,
  end_date date not null,
  min_grade int not null default 0,
  max_grade int not null default 12,
  capacity int not null default 0,
  price_cents int not null default 0 check (price_cents >= 0),
  deposit_cents int not null default 0 check (deposit_cents >= 0),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  check (end_date >= start_date),
  check (max_grade >= min_grade)
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  session_id uuid references public.camp_sessions(id) on delete restrict,
  camper_id uuid not null references public.campers(id) on delete cascade,
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  status text default 'submitted',
  step_completed int default 0,
  progress_percentage int default 0,
  consents_agreed jsonb not null default '{}'::jsonb,
  signed_by text,
  signed_at timestamptz,
  buddy_requests text[] default '{}',
  payment_plan text,
  total_tuition_cents int default 0,
  amount_paid_cents int default 0,
  canteen_balance_cents int default 0,
  checked_in boolean default false,
  checked_in_at timestamptz,
  camp_slug text,
  cabin_id uuid,
  cabin_name text,
  counselor_name text,
  photo_release_tier text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.health_profiles (
  id uuid primary key default gen_random_uuid(),
  camper_id uuid not null unique references public.campers(id) on delete cascade,
  has_allergies boolean default false,
  allergy_details text,
  has_epipen boolean default false,
  epipen_location text,
  dietary_restrictions text,
  medical_conditions text,
  has_medications boolean default false,
  medication_details text,
  physician_name text,
  physician_phone text,
  immunization_record_url text,
  immunization_status text default 'pending_review',
  special_care_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  camper_id uuid not null unique references public.campers(id) on delete cascade,
  insurance_company text not null,
  policyholder_name text not null,
  relationship_to_camper text not null,
  member_id text not null,
  group_number text,
  card_front_url text,
  card_back_url text,
  status text default 'pending_review',
  created_at timestamptz default now()
);

create table if not exists public.staff_applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  birth_date date not null,
  role_applied text not null,
  status text default 'submitted',
  background_check_id text,
  background_status text,
  certifications jsonb,
  experience_notes text,
  discussion_note text,
  flagged_for_discussion boolean not null default false,
  is_first_time_counselor boolean not null default false,
  willing_to_become_lifeguard boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.staff_references (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.staff_applications(id) on delete cascade,
  reference_name text not null,
  relationship text not null,
  phone text not null,
  email text,
  status text default 'pending',
  kaicalls_call_id uuid,
  call_transcript text,
  sentiment_score numeric,
  verified_at timestamptz,
  director_reviewed boolean default false,
  safety_approved boolean,
  created_at timestamptz default now()
);

create table if not exists public.kaicalls_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  call_type text not null,
  caller_phone text,
  recipient_phone text,
  duration_seconds int,
  summary text,
  full_transcript text,
  recording_url text,
  extracted_actions jsonb,
  status text not null,
  created_at timestamptz default now()
);

create table if not exists public.emar_logs (
  id uuid primary key default gen_random_uuid(),
  camper_id uuid not null references public.campers(id) on delete cascade,
  session_id uuid not null references public.camp_sessions(id) on delete cascade,
  medication_name text not null,
  dosage text not null,
  scheduled_time timestamptz not null,
  administered_at timestamptz,
  administered_by text not null,
  notes text
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  registration_id uuid references public.registrations(id) on delete set null,
  amount_cents int not null,
  payment_type text not null,
  status text not null,
  stripe_payment_intent_id text,
  created_at timestamptz default now()
);

create index if not exists campers_guardian_id_idx on public.campers (guardian_id);
create index if not exists registrations_session_id_idx on public.registrations (session_id);
create index if not exists registrations_camper_id_idx on public.registrations (camper_id);
create index if not exists registrations_guardian_id_idx on public.registrations (guardian_id);
create index if not exists staff_references_application_id_idx on public.staff_references (application_id);
create index if not exists emar_logs_camper_id_idx on public.emar_logs (camper_id);
create index if not exists emar_logs_session_id_idx on public.emar_logs (session_id);
create index if not exists transactions_registration_id_idx on public.transactions (registration_id);

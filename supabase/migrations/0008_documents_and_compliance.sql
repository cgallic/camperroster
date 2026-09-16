-- Document tracking, e-signatures, and multi-year compliance.
--
-- Three separate asks converge on one model. Campers owe medical forms and an
-- insurance card; teens owe a reference; adults owe PGC, VIRTUS and a background
-- check. The adult documents differ in one important way: they stay valid for
-- years, so a returning volunteer needs to see an expiry date at registration
-- rather than re-uploading. That is `validity_months` plus `expires_on`.

create table if not exists public.document_types (
  id                 uuid primary key default gen_random_uuid(),
  camp_id            uuid not null references public.camps(id) on delete cascade,
  code               text not null,
  name               text not null,
  description        text,
  applies_to         text not null check (applies_to in ('camper', 'teen_volunteer', 'adult_volunteer')),
  is_required        boolean not null default true,
  requires_upload    boolean not null default false,
  requires_signature boolean not null default false,
  -- Null means "good for this season only". A number carries the document
  -- forward and drives the renewal warning.
  validity_months    int,
  display_order      int not null default 0,
  created_at         timestamptz not null default now(),
  unique (camp_id, code)
);

comment on column public.document_types.validity_months is
  'Null for single-season documents. Set for multi-year credentials (PGC, VIRTUS, background checks) so returning volunteers see when theirs expires.';

create table if not exists public.document_records (
  id                   uuid primary key default gen_random_uuid(),
  camp_id              uuid not null references public.camps(id) on delete cascade,
  season_id            uuid references public.seasons(id) on delete set null,
  document_type_id     uuid not null references public.document_types(id) on delete cascade,
  camper_id            uuid references public.campers(id) on delete cascade,
  staff_application_id uuid references public.staff_applications(id) on delete cascade,
  status               text not null default 'missing' check (status in (
                         'missing', 'submitted', 'approved', 'rejected', 'expired')),
  -- Storage object path, not a public URL. Medical documents are served through
  -- a signed URL issued per request, never linked directly.
  file_path            text,
  file_content_type    text,
  issued_on            date,
  expires_on           date,
  reviewed_by          uuid,
  reviewed_at          timestamptz,
  rejection_reason     text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint document_records_subject_ck check (
    (camper_id is not null) <> (staff_application_id is not null)
  )
);

create index if not exists document_records_camper_idx  on public.document_records (camper_id);
create index if not exists document_records_staff_idx   on public.document_records (staff_application_id);
create index if not exists document_records_expiry_idx  on public.document_records (camp_id, expires_on)
  where expires_on is not null;

-- Fills in the expiry the document type implies, so no caller has to remember to.
create or replace function public.set_document_expiry()
returns trigger
language plpgsql
as $$
declare
  v_validity int;
begin
  select validity_months into v_validity
    from public.document_types where id = new.document_type_id;

  if v_validity is not null and new.issued_on is not null and new.expires_on is null then
    new.expires_on := new.issued_on + make_interval(months => v_validity);
  end if;

  if new.expires_on is not null and new.expires_on < current_date and new.status = 'approved' then
    new.status := 'expired';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists document_records_set_expiry on public.document_records;
create trigger document_records_set_expiry
  before insert or update on public.document_records
  for each row execute function public.set_document_expiry();

-- E-signatures -----------------------------------------------------------------
-- Captures what was agreed to, not just that something was agreed to: the hash
-- pins the exact wording, so a later edit to a waiver cannot silently rewrite
-- what someone signed.
create table if not exists public.signatures (
  id                 uuid primary key default gen_random_uuid(),
  camp_id            uuid not null references public.camps(id) on delete cascade,
  document_record_id uuid references public.document_records(id) on delete cascade,
  registration_id    uuid references public.registrations(id) on delete cascade,
  statement          text not null,
  statement_sha256   text not null,
  signer_name        text not null,
  signer_user_id     uuid,
  signer_ip          inet,
  signer_user_agent  text,
  signed_at          timestamptz not null default now()
);

create index if not exists signatures_document_idx on public.signatures (document_record_id);

-- Completeness -----------------------------------------------------------------
-- One row per camper registration: how many required documents are outstanding.
-- The portal's progress bar and the "pending / overdue" split both read this.
create or replace view public.registration_document_status as
  select r.id                                   as registration_id,
         r.camp_id,
         r.camper_id,
         count(*) filter (where dt.is_required) as required_total,
         count(*) filter (where dt.is_required and dr.status = 'approved') as required_approved,
         count(*) filter (where dt.is_required and coalesce(dr.status, 'missing') <> 'approved') as required_outstanding
    from public.registrations r
    join public.document_types dt
      on dt.camp_id = r.camp_id and dt.applies_to = 'camper'
    left join public.document_records dr
      on dr.document_type_id = dt.id and dr.camper_id = r.camper_id
   group by r.id, r.camp_id, r.camper_id;

-- Policies ---------------------------------------------------------------------
alter table public.document_types   enable row level security;
alter table public.document_records enable row level security;
alter table public.signatures       enable row level security;

drop policy if exists document_types_member_select on public.document_types;
create policy document_types_member_select on public.document_types
  for select to authenticated using (public.is_camp_member(camp_id));

drop policy if exists document_types_registrar_write on public.document_types;
create policy document_types_registrar_write on public.document_types
  for all to authenticated
  using (public.has_camp_role(camp_id, array['registrar']))
  with check (public.has_camp_role(camp_id, array['registrar']));

-- Medical paperwork is the nurse's and the registrar's business; the red shirt
-- team clears compliance. A counselor has no reason to read either.
drop policy if exists document_records_staff_select on public.document_records;
create policy document_records_staff_select on public.document_records
  for select to authenticated
  using (public.has_camp_role(camp_id, array['registrar', 'nurse', 'red_shirt']));

drop policy if exists document_records_staff_write on public.document_records;
create policy document_records_staff_write on public.document_records
  for all to authenticated
  using (public.has_camp_role(camp_id, array['registrar', 'nurse', 'red_shirt']))
  with check (public.has_camp_role(camp_id, array['registrar', 'nurse', 'red_shirt']));

drop policy if exists signatures_staff_select on public.signatures;
create policy signatures_staff_select on public.signatures
  for select to authenticated
  using (public.has_camp_role(camp_id, array['registrar', 'nurse', 'red_shirt']));

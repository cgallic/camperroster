-- =============================================================================
-- 0001_tenancy_and_auth.sql
-- CamperRoster: multi-tenancy + authentication + deny-by-default RLS.
--
-- WHY THIS EXISTS
--   Before this migration the application had no authentication of any kind,
--   every API route used the service-role key (which bypasses RLS entirely),
--   and /api/register + /api/volunteer hardcoded
--   organization_id = '11111111-1111-1111-1111-111111111111'. Two different
--   camps would have written into the same tenant and every table was readable
--   by anyone holding the publishable anon key -- including children's medical
--   records and guardian PII.
--
-- IDEMPOTENCY
--   This script is safe to run more than once. Every DDL statement is guarded
--   (IF NOT EXISTS / IF EXISTS / to_regclass) and every CREATE POLICY is
--   preceded by DROP POLICY IF EXISTS, because the live schema could not be
--   fully introspected from the machine that wrote it. Tables that do not
--   exist are skipped rather than erroring.
--
-- ONE TENANT CONCEPT: public.camps
--   The live schema carried TWO competing tenant roots:
--     * public.camps          -- written by /start via POST /api/camps
--     * public.organizations  -- referenced only as a hardcoded organization_id
--                                literal in three API routes
--   Nothing in the application ever SELECTed from organizations, ever created
--   an organizations row, and ever showed one to a user. It was a redundant
--   second tenant concept. THE TENANT ROOT IS public.camps. This migration:
--     * adds camp_id to every tenant-scoped table,
--     * drops the NOT NULL constraint on any surviving organization_id column
--       so legacy rows/inserts do not block the cut-over,
--     * marks organization_id deprecated via COMMENT,
--     * enables RLS on public.organizations with NO policies, so it is
--       unreachable by anon and authenticated alike.
--   organization_id columns are intentionally NOT dropped: dropping data
--   columns is irreversible, and all known tables currently hold 0 rows so
--   there is nothing to migrate. A later migration may drop them once the
--   deployment has run on camp_id for a full season.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Tenant root: public.camps
-- -----------------------------------------------------------------------------
-- camps already exists live with exactly:
--   id, name, slug, director_name, director_email, created_at
-- We only harden it. We do not recreate it.

create table if not exists public.camps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  director_name text,
  director_email text,
  created_at timestamptz not null default now()
);

-- created_at must never be null and must default sanely even when a client
-- omits it (the signup route does omit it).
do $$
begin
  if to_regclass('public.camps') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'camps' and column_name = 'created_at'
     )
  then
    execute 'alter table public.camps alter column created_at set default now()';
    -- Only enforce NOT NULL when no existing row would violate it.
    if not exists (select 1 from public.camps where created_at is null) then
      execute 'alter table public.camps alter column created_at set not null';
    end if;
  end if;
end $$;

-- The slug is the public namespace (camperroster.com/c/<slug>). Two camps
-- sharing one is a cross-tenant leak, not a cosmetic bug.
create unique index if not exists camps_slug_key on public.camps (slug);

comment on table public.camps is
  'Tenant root. One row per camp. Every tenant-scoped table carries camp_id referencing this table.';

-- -----------------------------------------------------------------------------
-- 2. Membership: who may see a camp, and in what role
-- -----------------------------------------------------------------------------
create table if not exists public.camp_members (
  camp_id    uuid not null references public.camps(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('director','nurse','counselor','staff')),
  created_at timestamptz not null default now(),
  primary key (camp_id, user_id)
);

-- Every policy in this file answers "which camps does auth.uid() belong to?",
-- which is a lookup by user_id. Without this index that lookup is a seq scan
-- on every row of every query.
create index if not exists camp_members_user_id_idx on public.camp_members (user_id);
create index if not exists camp_members_camp_id_role_idx on public.camp_members (camp_id, role);

comment on table public.camp_members is
  'Join table between auth.users and camps. Membership here is the ONLY thing that grants access to tenant data.';

-- -----------------------------------------------------------------------------
-- 3. SECURITY DEFINER membership helpers
-- -----------------------------------------------------------------------------
-- These exist to break policy recursion. A policy on camp_members that reads
-- camp_members re-enters RLS and errors with "infinite recursion detected in
-- policy". A SECURITY DEFINER function runs as its owner and is not subject to
-- the caller's RLS, so the lookup terminates.
--
-- They are STABLE (same result within a statement -> the planner may cache
-- them) and pin search_path so a caller cannot shadow `camp_members` with a
-- table in their own schema and lie about membership.

create or replace function public.current_user_camp_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select cm.camp_id
  from public.camp_members cm
  where cm.user_id = auth.uid();
$$;

create or replace function public.is_camp_member(p_camp_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.camp_members cm
    where cm.user_id = auth.uid()
      and cm.camp_id = p_camp_id
  );
$$;

create or replace function public.is_camp_director(p_camp_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.camp_members cm
    where cm.user_id = auth.uid()
      and cm.camp_id = p_camp_id
      and cm.role = 'director'
  );
$$;

-- An anonymous visitor must never be able to probe membership.
revoke all on function public.current_user_camp_ids() from public, anon;
revoke all on function public.is_camp_member(uuid)     from public, anon;
revoke all on function public.is_camp_director(uuid)   from public, anon;
grant execute on function public.current_user_camp_ids() to authenticated;
grant execute on function public.is_camp_member(uuid)     to authenticated;
grant execute on function public.is_camp_director(uuid)   to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Add camp_id to every tenant-scoped table
-- -----------------------------------------------------------------------------
-- Guarded by to_regclass so a table that does not exist in this project is
-- skipped instead of aborting the whole migration.
do $$
declare
  t text;
  tenant_tables text[] := array[
    'registrations',
    'campers',
    'guardians',
    'health_profiles',
    'insurance_policies',
    'staff_applications',
    'staff_references',
    'bunk_notes',
    'cabins',
    'kaicalls_logs',
    'camp_sessions'   -- referenced by registrations.session_id; may not exist
  ];
begin
  foreach t in array tenant_tables loop
    if to_regclass('public.' || t) is not null then
      execute format(
        'alter table public.%I add column if not exists camp_id uuid references public.camps(id) on delete cascade',
        t
      );
      execute format(
        'create index if not exists %I on public.%I (camp_id)',
        t || '_camp_id_idx', t
      );
      execute format(
        'comment on column public.%I.camp_id is %L',
        t, 'Tenant key. Every read and write is filtered on this by RLS.'
      );
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 5. Retire organization_id
-- -----------------------------------------------------------------------------
-- The application no longer writes organization_id. If any of these columns is
-- NOT NULL, inserts from the new code path would fail, so the constraint is
-- dropped. The column itself is kept (see the header note on why).
do $$
declare
  r record;
begin
  for r in
    select c.table_name
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.column_name = 'organization_id'
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = r.table_name
        and column_name = 'organization_id'
        and is_nullable = 'NO'
    ) then
      execute format('alter table public.%I alter column organization_id drop not null', r.table_name);
    end if;

    execute format(
      'comment on column public.%I.organization_id is %L',
      r.table_name,
      'DEPRECATED 2026-09: superseded by camp_id. public.camps is the single tenant root. No application code writes this column.'
    );
  end loop;
end $$;

-- Same for registrations.session_id: the old code fabricated a session UUID
-- ('22222222-...') when none was configured. That literal is gone from the
-- application, so a camp with no configured session must be allowed to store a
-- registration with session_id null rather than be given someone else's session.
do $$
begin
  if to_regclass('public.registrations') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'registrations'
         and column_name = 'session_id' and is_nullable = 'NO'
     )
  then
    execute 'alter table public.registrations alter column session_id drop not null';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 6. Row Level Security
-- -----------------------------------------------------------------------------
-- Deny by default. RLS with zero matching policies denies everything, so the
-- baseline for anon on every table below is: no select, no insert, no update,
-- no delete. Every policy created here is granted TO authenticated only.
--
-- NOT enabling FORCE ROW LEVEL SECURITY deliberately: the Supabase service_role
-- key is BYPASSRLS and must keep working for the two genuinely public write
-- paths (a parent submitting a registration, a volunteer applying) and for the
-- signup provisioning route, which has to create a camp before any membership
-- row exists. Those are the only server-side uses of that key, each filters by
-- camp_id in application code, and each is commented at the call site.

-- 6a. camps
alter table public.camps enable row level security;

drop policy if exists camps_member_select on public.camps;
create policy camps_member_select on public.camps
  for select to authenticated
  using (public.is_camp_member(id));

drop policy if exists camps_director_update on public.camps;
create policy camps_director_update on public.camps
  for update to authenticated
  using (public.is_camp_director(id))
  with check (public.is_camp_director(id));

-- No INSERT or DELETE policy for authenticated: a camp is created only by the
-- signup provisioning route (service role, inside a compensating transaction
-- that deletes the camp and the auth user if any later step fails), and camps
-- are never deleted from the application.

-- 6b. camp_members
alter table public.camp_members enable row level security;

drop policy if exists camp_members_self_or_camp_select on public.camp_members;
create policy camp_members_self_or_camp_select on public.camp_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_camp_member(camp_id));

drop policy if exists camp_members_director_insert on public.camp_members;
create policy camp_members_director_insert on public.camp_members
  for insert to authenticated
  with check (public.is_camp_director(camp_id));

drop policy if exists camp_members_director_update on public.camp_members;
create policy camp_members_director_update on public.camp_members
  for update to authenticated
  using (public.is_camp_director(camp_id))
  with check (public.is_camp_director(camp_id));

drop policy if exists camp_members_director_delete on public.camp_members;
create policy camp_members_director_delete on public.camp_members
  for delete to authenticated
  using (public.is_camp_director(camp_id));

-- 6c. every tenant-scoped table: one row is reachable only when its camp_id is
--     one of the caller's camps.
do $$
declare
  t text;
  tenant_tables text[] := array[
    'registrations',
    'campers',
    'guardians',
    'health_profiles',
    'insurance_policies',
    'staff_applications',
    'staff_references',
    'bunk_notes',
    'cabins',
    'kaicalls_logs',
    'camp_sessions'
  ];
begin
  foreach t in array tenant_tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_member_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_camp_member(camp_id))',
      t || '_member_select', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_member_insert', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_camp_member(camp_id))',
      t || '_member_insert', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_member_update', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_camp_member(camp_id)) with check (public.is_camp_member(camp_id))',
      t || '_member_update', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_member_delete', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_camp_member(camp_id))',
      t || '_member_delete', t
    );
  end loop;
end $$;

-- 6d. organizations: the retired tenant concept. RLS on, zero policies, so it
--     is unreachable by anon and authenticated. Kept only so existing rows are
--     not destroyed.
do $$
begin
  if to_regclass('public.organizations') is not null then
    execute 'alter table public.organizations enable row level security';
    execute 'comment on table public.organizations is ''DEPRECATED 2026-09: replaced by public.camps as the tenant root. RLS enabled with no policies -- deliberately unreachable.''';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 7. Children's medical data and parent PII: belt and braces
-- -----------------------------------------------------------------------------
-- RLS already denies anon on these tables because no policy names the anon
-- role. The grants below remove the underlying table privilege as well, so an
-- accidental future "for select to public" policy still cannot expose a child's
-- allergy list or a parent's home address to an unauthenticated visitor.
--
-- Parent-facing reads (the household portal) must therefore go through an
-- authenticated identity or a server-side, explicitly-scoped path. There is
-- deliberately NO blanket anon select on any of these tables.
do $$
declare
  t text;
  pii_tables text[] := array[
    'guardians',
    'campers',
    'health_profiles',
    'insurance_policies',
    'bunk_notes',
    'staff_applications',
    'staff_references'
  ];
begin
  foreach t in array pii_tables loop
    if to_regclass('public.' || t) is not null then
      execute format('revoke all on table public.%I from anon', t);
    end if;
  end loop;
end $$;

-- Membership itself is not public information either.
revoke all on table public.camp_members from anon;

-- -----------------------------------------------------------------------------
-- 8. Tell PostgREST about all of the above
-- -----------------------------------------------------------------------------
notify pgrst, 'reload schema';

commit;

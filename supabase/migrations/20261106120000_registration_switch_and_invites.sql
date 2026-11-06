-- Registration on/off switch and private invite links (Camp Hope, Nov 2026).
--
-- The director asked for one switch that turns registration off, and for a
-- way to still let named individuals register while it is off. Additive only:
--
--   1. camps.registration_open: the camp-wide switch. It defaults to true, so
--      every existing period keeps behaving exactly as it does today until a
--      director turns it off. Directors already own camps updates
--      (camps_director_update), so no new write path is needed.
--   2. registration_invites: one row per private link. Only the SHA-256 of the
--      token is stored, as with staff_invitations; the link is shown once. A
--      live invite admits its holder to that period's published form whatever
--      the switch, window or visibility says. Revoking stamps revoked_at.
--   3. note_registration_invite_use(): bumps the use count from public intake,
--      which runs as the service role.

alter table public.camps
  add column if not exists registration_open boolean not null default true;

comment on column public.camps.registration_open is
  'Director switch. False closes every registration form to the public; live registration_invites still admit their holders.';

create table if not exists public.registration_invites (
  id            uuid primary key default gen_random_uuid(),
  camp_id       uuid not null references public.camps(id) on delete cascade,
  period_id     uuid not null references public.registration_periods(id) on delete cascade,
  -- Who the link is for, so the director can tell links apart. Never shown publicly.
  label         text check (label is null or char_length(label) <= 200),
  token_sha256  text not null unique,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  last_used_at  timestamptz,
  use_count     int not null default 0
);

create index if not exists registration_invites_camp_idx
  on public.registration_invites (camp_id, created_at desc);
create index if not exists registration_invites_period_idx
  on public.registration_invites (period_id);
create index if not exists registration_invites_created_by_idx
  on public.registration_invites (created_by);

alter table public.registration_invites enable row level security;
revoke all on table public.registration_invites from anon;

-- Directors only, and an invite can only point at one of the camp's own periods.
drop policy if exists registration_invites_director_all on public.registration_invites;
create policy registration_invites_director_all on public.registration_invites
  for all to authenticated
  using (public.is_camp_director(camp_id))
  with check (
    public.is_camp_director(camp_id)
    and exists (
      select 1 from public.registration_periods p
       where p.id = registration_invites.period_id
         and p.camp_id = registration_invites.camp_id
    )
  );

drop trigger if exists audit_registration_invites on public.registration_invites;
create trigger audit_registration_invites after insert or update or delete on public.registration_invites
  for each row execute function public.record_audit();

create or replace function public.note_registration_invite_use(p_invite_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.registration_invites
     set use_count = use_count + 1,
         last_used_at = now()
   where id = p_invite_id
     and revoked_at is null;
$$;

revoke all on function public.note_registration_invite_use(uuid) from public, anon, authenticated;
grant execute on function public.note_registration_invite_use(uuid) to service_role;

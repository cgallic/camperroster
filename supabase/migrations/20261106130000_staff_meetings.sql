-- Sign-in for staff meetings (Camp Hope, Nov 2026).
--
-- The director wants the volunteer mandatory meeting checked in the way
-- arrival day is: everyone signs in, and everyone's required documents are in.
-- Additive only. The expected list is the camp's staff_applications and the
-- paperwork check reads document_records, so the only new state is the meeting
-- itself and who signed in. A row in staff_meeting_attendance IS the sign-in;
-- undoing one deletes the row.
--
-- Access matches the people who can already read volunteers and their
-- documents: directors, registrars and the red shirt (compliance) team.

create table if not exists public.staff_meetings (
  id          uuid primary key default gen_random_uuid(),
  camp_id     uuid not null references public.camps(id) on delete cascade,
  season_id   uuid references public.seasons(id) on delete set null,
  name        text not null check (char_length(name) between 1 and 200),
  held_on     date,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists staff_meetings_camp_idx on public.staff_meetings (camp_id, held_on desc);
create index if not exists staff_meetings_season_idx on public.staff_meetings (season_id);
create index if not exists staff_meetings_created_by_idx on public.staff_meetings (created_by);

create table if not exists public.staff_meeting_attendance (
  id                   uuid primary key default gen_random_uuid(),
  camp_id              uuid not null references public.camps(id) on delete cascade,
  meeting_id           uuid not null references public.staff_meetings(id) on delete cascade,
  staff_application_id uuid not null references public.staff_applications(id) on delete cascade,
  signed_in_at         timestamptz not null default now(),
  signed_in_by         uuid default auth.uid() references auth.users(id) on delete set null,
  unique (meeting_id, staff_application_id)
);

create index if not exists staff_meeting_attendance_camp_idx on public.staff_meeting_attendance (camp_id);
create index if not exists staff_meeting_attendance_staff_idx on public.staff_meeting_attendance (staff_application_id);
create index if not exists staff_meeting_attendance_signed_in_by_idx on public.staff_meeting_attendance (signed_in_by);

alter table public.staff_meetings           enable row level security;
alter table public.staff_meeting_attendance enable row level security;
revoke all on table public.staff_meetings, public.staff_meeting_attendance from anon;

drop policy if exists staff_meetings_select on public.staff_meetings;
create policy staff_meetings_select on public.staff_meetings
  for select to authenticated
  using (public.has_camp_role(camp_id, array['registrar', 'red_shirt']));

drop policy if exists staff_meetings_write on public.staff_meetings;
create policy staff_meetings_write on public.staff_meetings
  for all to authenticated
  using (public.has_camp_role(camp_id, array['registrar', 'red_shirt']))
  with check (public.has_camp_role(camp_id, array['registrar', 'red_shirt']));

drop policy if exists staff_meeting_attendance_select on public.staff_meeting_attendance;
create policy staff_meeting_attendance_select on public.staff_meeting_attendance
  for select to authenticated
  using (public.has_camp_role(camp_id, array['registrar', 'red_shirt']));

-- The meeting and the volunteer must both belong to the row's camp, so a
-- sign-in can never point across tenants.
drop policy if exists staff_meeting_attendance_write on public.staff_meeting_attendance;
create policy staff_meeting_attendance_write on public.staff_meeting_attendance
  for all to authenticated
  using (public.has_camp_role(camp_id, array['registrar', 'red_shirt']))
  with check (
    public.has_camp_role(camp_id, array['registrar', 'red_shirt'])
    and exists (select 1 from public.staff_meetings m
                 where m.id = staff_meeting_attendance.meeting_id and m.camp_id = staff_meeting_attendance.camp_id)
    and exists (select 1 from public.staff_applications s
                 where s.id = staff_meeting_attendance.staff_application_id and s.camp_id = staff_meeting_attendance.camp_id)
  );

drop trigger if exists audit_staff_meeting_attendance on public.staff_meeting_attendance;
create trigger audit_staff_meeting_attendance after insert or update or delete on public.staff_meeting_attendance
  for each row execute function public.record_audit();

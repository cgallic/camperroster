-- Outgoing mail, held for review.
--
-- The camp's rule is that nothing goes out unread: a draft lands with the
-- communicator the day before, carrying its subject, its recipient list, and a
-- link back to the data it was built from, and only a human approval releases
-- it. So a message is a row with an approval step, not a send() call.

create table if not exists public.email_templates (
  id          uuid primary key default gen_random_uuid(),
  camp_id     uuid not null references public.camps(id) on delete cascade,
  code        text not null,
  name        text not null,
  subject     text not null,
  body        text not null,
  -- Placeholder keys the body may use, e.g. ["camper_name","missing_items"].
  merge_keys  jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  unique (camp_id, code)
);

create table if not exists public.outgoing_messages (
  id              uuid primary key default gen_random_uuid(),
  camp_id         uuid not null references public.camps(id) on delete cascade,
  template_id     uuid references public.email_templates(id) on delete set null,
  subject         text not null,
  body            text not null,
  audience_label  text not null,
  -- Snapshot of who it goes to, resolved when the draft was built, so the
  -- reviewer approves the list they actually saw.
  recipients      jsonb not null default '[]'::jsonb,
  -- Where the list came from, so the reviewer can check the underlying data.
  source_view     text,
  scheduled_for   timestamptz,
  status          text not null default 'draft' check (status in (
                    'draft', 'awaiting_review', 'approved', 'sent', 'cancelled', 'failed')),
  approved_by     uuid,
  approved_at     timestamptz,
  sent_at         timestamptz,
  failure_reason  text,
  created_at      timestamptz not null default now()
);

create index if not exists outgoing_messages_queue_idx
  on public.outgoing_messages (camp_id, status, scheduled_for);

create table if not exists public.notification_rules (
  id            uuid primary key default gen_random_uuid(),
  camp_id       uuid not null references public.camps(id) on delete cascade,
  trigger_code  text not null,
  template_id   uuid references public.email_templates(id) on delete set null,
  -- Staff addresses that get the alert, for the internal ones (cabin nearly
  -- full, pastoral flag raised).
  notify_emails text[] not null default '{}',
  -- False routes the result to the review queue instead of sending.
  auto_send     boolean not null default false,
  is_enabled    boolean not null default true,
  unique (camp_id, trigger_code)
);

comment on column public.notification_rules.trigger_code is
  'Event key, e.g. cabin_two_from_cap, waitlisted, registration_incomplete_3d, payment_due_soon, payment_late, pastoral_flag.';

-- Responses the pastoral team asked to see immediately rather than at the end
-- of the season.
create table if not exists public.pastoral_flags (
  id              uuid primary key default gen_random_uuid(),
  camp_id         uuid not null references public.camps(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete cascade,
  staff_application_id uuid references public.staff_applications(id) on delete cascade,
  reason          text not null,
  detail          text,
  raised_at       timestamptz not null default now(),
  -- Stays on the meeting agenda until someone closes it out.
  resolved_at     timestamptz,
  resolved_by     uuid,
  resolution_note text
);

create index if not exists pastoral_flags_open_idx
  on public.pastoral_flags (camp_id, raised_at desc) where resolved_at is null;

alter table public.email_templates     enable row level security;
alter table public.outgoing_messages   enable row level security;
alter table public.notification_rules  enable row level security;
alter table public.pastoral_flags      enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['email_templates', 'outgoing_messages', 'notification_rules'] loop
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

-- Pastoral flags carry sensitive detail about a child; leadership only.
drop policy if exists pastoral_flags_leadership_select on public.pastoral_flags;
create policy pastoral_flags_leadership_select on public.pastoral_flags
  for select to authenticated
  using (public.has_camp_role(camp_id, array['registrar']));

drop policy if exists pastoral_flags_leadership_write on public.pastoral_flags;
create policy pastoral_flags_leadership_write on public.pastoral_flags
  for all to authenticated
  using (public.has_camp_role(camp_id, array['registrar']))
  with check (public.has_camp_role(camp_id, array['registrar']));

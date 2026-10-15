-- Sales leads from the marketing site ("Book a walkthrough" form).
-- Additive only. Written by the service role from /api/leads; no anon or
-- authenticated access, so a lead's contact details are never readable from
-- the browser.

create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  camp_name text check (camp_name is null or char_length(camp_name) <= 200),
  camper_count text check (camper_count is null or char_length(camper_count) <= 40),
  current_tool text check (current_tool is null or char_length(current_tool) <= 200),
  message text check (message is null or char_length(message) <= 4000),
  source_path text check (source_path is null or char_length(source_path) <= 300),
  utm jsonb,
  status text not null default 'new' check (status in ('new', 'contacted', 'demo_booked', 'won', 'lost', 'spam')),
  created_at timestamptz not null default now()
);

alter table public.sales_leads enable row level security;
revoke all on table public.sales_leads from anon, authenticated;
create index if not exists sales_leads_created_idx on public.sales_leads (created_at desc);

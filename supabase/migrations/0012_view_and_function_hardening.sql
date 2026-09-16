-- Close the gaps the database linter found in 0005-0009.
--
-- A Postgres view runs as its owner by default, which means it reads straight
-- past the row-level security on the tables underneath it. Every reporting view
-- added in this branch had that problem -- `outstanding_balances` would have
-- shown any signed-in user every household's balance regardless of their role.
-- `security_invoker` makes the view read as the caller, so the policies apply.

alter view public.cabin_occupancy               set (security_invoker = on);
alter view public.registration_document_status  set (security_invoker = on);
alter view public.outstanding_balances          set (security_invoker = on);
alter view public.volunteer_coverage            set (security_invoker = on);

-- A function without a pinned search_path can be redirected by a caller-set
-- path to run against attacker-supplied objects of the same name.
alter function public.registration_period_is_open(public.registration_periods) set search_path = public, pg_temp;
alter function public.cabin_camper_count(uuid)                                 set search_path = public, pg_temp;
alter function public.set_document_expiry()                                    set search_path = public, pg_temp;
alter function public.family_tuition_cents(uuid, int, date)                    set search_path = public, pg_temp;

-- Supabase exposes every function in `public` as an RPC endpoint. Cabin
-- placement runs as SECURITY DEFINER so it can lock rows, which made it callable
-- by anyone holding the publishable key -- enough to place or waitlist an
-- arbitrary registration. Staff reach it through the API route, which checks the
-- caller's role first.
revoke execute on function public.assign_camper_to_cabin(uuid) from anon, authenticated;

-- Internal predicates and the audit trigger are never called directly.
revoke execute on function public.has_camp_role(uuid, text[]) from anon;
revoke execute on function public.record_audit() from anon, authenticated;

-- Tables carrying RLS with no policy at all, which makes them unreadable to
-- everyone including the staff who need them.
drop policy if exists emar_logs_medical_select on public.emar_logs;
create policy emar_logs_medical_select on public.emar_logs
  for select to authenticated
  using (exists (
    select 1 from public.campers c
     where c.id = emar_logs.camper_id
       and public.has_camp_role(c.camp_id, array['nurse'])
  ));

drop policy if exists emar_logs_medical_write on public.emar_logs;
create policy emar_logs_medical_write on public.emar_logs
  for all to authenticated
  using (exists (
    select 1 from public.campers c
     where c.id = emar_logs.camper_id
       and public.has_camp_role(c.camp_id, array['nurse'])
  ))
  with check (exists (
    select 1 from public.campers c
     where c.id = emar_logs.camper_id
       and public.has_camp_role(c.camp_id, array['nurse'])
  ));

-- `transactions` predates the payments tables in 0007 and is superseded by
-- public.payments. Left readable to the registrar so historical rows stay
-- visible; new writes go to the tables in 0007.
drop policy if exists transactions_finance_select on public.transactions;
create policy transactions_finance_select on public.transactions
  for select to authenticated
  using (exists (
    select 1 from public.registrations r
     where r.id = transactions.registration_id
       and public.has_camp_role(r.camp_id, array['registrar'])
  ));

comment on table public.transactions is
  'DEPRECATED 2026-09: superseded by public.payments and public.family_invoices. Read-only for historical rows.';

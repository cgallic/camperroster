# CamperRoster database migrations

Migrations live in `supabase/migrations/` and are applied **in filename order**.

| File | What it does | Depends on |
|---|---|---|
| `20260916020000_core_schema.sql` | Recreates the dashboard-era core tables a fresh database needs. Uses additive `IF NOT EXISTS` DDL and does not replace live rows. | Nothing. Runs first on a fresh database. |
| `20260916030241_tenancy_and_auth.sql` | Makes `public.camps` the single tenant root, adds `camp_members`, adds `camp_id` to every tenant-scoped table, enables deny-by-default RLS everywhere, retires `organizations` / `organization_id`. | Core schema. |
| `20260916034301`-`20260916163453` | The 19 remaining migrations already recorded in the hosted production ledger: billing, roles, camp operations, documents, payments, communications, placement, and hardening. | Apply in filename order. |
| `20260921120000_historical_imports.sql` | Creates the director-only historical source table. It never overwrites or deletes imported rows. | Membership helpers. |
| `20260921121000_security_backend.sql` | Adds transactional/idempotent intake, staff invitations, wallet integrity, medical review provenance, and tightened role policies. | Everything through historical imports. |

> `20260916034301_billing.sql` depends on tenancy/auth having been applied (it
> needs `camps`, `camp_members` and `public.is_camp_member(uuid)`). Never run it
> out of filename order.

`npm run check:migrations` verifies the exact hosted ledger filenames plus the
approved pending migrations, requires unique increasing 14-digit versions, and
rejects table/schema drops and truncation before a release.

---

## Applying them

### Fresh database

Use the CLI so every migration is applied and recorded in timestamp order:

```sh
supabase migration list --db-url "$DATABASE_URL"
supabase db push --dry-run --db-url "$DATABASE_URL"
supabase db push --db-url "$DATABASE_URL"
```

### Existing production database

Production already has the core tables and the 20 migrations from
`20260916030241` through `20260916163453`. The core baseline predates that
ledger, so mark only its version applied once; do not execute its DDL against
production:

```sh
supabase migration list --db-url "$DATABASE_URL"
supabase migration repair --db-url "$DATABASE_URL" --status applied 20260916020000
supabase migration list --db-url "$DATABASE_URL"
```

The second list must align all versions through `20260916163453` and show only
`20260921120000` and `20260921121000` as local/pending. Stop if it shows any
other mismatch. Then dry-run and push those two genuinely new migrations. The
repair changes only migration bookkeeping; it does not change participant data.

---

## Verify afterwards

Run each of these in the SQL editor. The expected result is stated beside it.

**1. The membership table and its index exist**

```sql
select 'table' as kind, to_regclass('public.camp_members')::text as obj
union all
select 'index', indexname from pg_indexes
 where schemaname='public' and tablename='camp_members';
```
Expect `public.camp_members` plus `camp_members_pkey`,
`camp_members_user_id_idx`, `camp_members_camp_id_role_idx`.

**2. Every tenant table has `camp_id`**

```sql
select table_name,
       bool_or(column_name = 'camp_id') as has_camp_id
from information_schema.columns
where table_schema = 'public'
  and table_name in ('registrations','campers','guardians','health_profiles',
                     'insurance_policies','staff_applications','staff_references',
                     'bunk_notes','cabins','kaicalls_logs')
group by table_name
order by table_name;
```
Expect `has_camp_id = true` on every row.

**3. RLS is on everywhere, and nothing is left unprotected**

```sql
select relname, relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by relrowsecurity, relname;
```
Expect `relrowsecurity = true` for **every** row. Any `false` is a table the
migration did not know about — it is readable with the publishable anon key and
needs a follow-up migration.

**4. No policy grants the `anon` role anything**

```sql
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and ('anon' = any(roles) or 'public' = any(roles));
```
Expect **zero rows**. Any row here is an anonymous-access hole. On
`guardians`, `campers`, `health_profiles` or `insurance_policies` it is an
exposure of a child's medical record or a parent's home address.

**5. The helper functions are SECURITY DEFINER and STABLE**

```sql
select p.proname, p.prosecdef as security_definer, p.provolatile
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public'
  and p.proname in ('current_user_camp_ids','is_camp_member','is_camp_director');
```
Expect `security_definer = true` and `provolatile = 's'` (stable) on all three.

**6. `organizations` is unreachable**

```sql
select relrowsecurity from pg_class where oid = 'public.organizations'::regclass;
select count(*) from pg_policies where schemaname='public' and tablename='organizations';
```
Expect `true` and `0`.

**7. End-to-end tenant isolation (the one that actually matters)**

Create two camps and two users through the app's `/signup` page, then, signed in
as camp A's director, run from the app (not the SQL editor — the SQL editor runs
as `postgres`, which bypasses RLS and will tell you everything is fine when it
is not):

```
GET /api/admin/overview
```

It must report only camp A's counts. Registering a camper at
`/register?camp=<camp-B-slug>` must not change any number camp A sees.

---

## What the application does when these have NOT been applied

The app degrades honestly rather than crashing or silently reading the wrong
tenant:

* `getCurrentCamp()` (`src/lib/auth.ts`) throws `SetupIncompleteError` when
  PostgREST reports a missing table/column/relationship (`42P01`, `42703`,
  `PGRST200/202/204`).
* Every tenant-scoped API route catches that and returns
  **HTTP 503** `{ "error": "setup_incomplete", … }`.
* `/admin` renders a "Database setup incomplete" panel instead of numbers.
* `POST /api/camps` (signup) refuses to half-create an account: if the camp row,
  the auth user, or the `camp_members` row cannot be written, everything already
  created is rolled back and the caller gets 503.

There is **no** code path that falls back to a default tenant.

---

## Notes on choices that are easy to second-guess

* **`FORCE ROW LEVEL SECURITY` is deliberately not set.** The Supabase
  `service_role` key is `BYPASSRLS` and has to keep working for the three
  genuinely-unauthenticated server paths: a parent submitting a registration, a
  volunteer applying, and signup provisioning (which must create a camp *before*
  any membership row exists). Each of those call sites filters by `camp_id` in
  application code and carries a comment saying why it is service-role.
* **`organization_id` columns are not dropped.** Dropping a data column is
  irreversible. Their `NOT NULL` constraints are dropped, they are `COMMENT`ed
  as deprecated, and no application code writes them. A later migration can drop
  them once a full season has run on `camp_id`.
* **`registrations.session_id` loses its `NOT NULL`.** The old route invented
  `'22222222-2222-2222-2222-222222222222'` when no session was configured. That
  literal is gone; a camp with no session now stores `session_id = null` rather
  than being pointed at another camp's session.

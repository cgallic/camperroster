# CamperRoster production runbook

This runbook promotes the canonical `main` branch without resetting the database
or replacing the private Camp Hope history. Commands print counts and identifiers,
never source rows, credentials, medical data, or guardian data.

## Release invariants

- `origin/main` is the only production source branch.
- Database changes are additive. Never run `supabase db reset` against production.
- Camp Hope must retain exactly 1,246 rows in `camp_registration_imports` before
  and after migration and deployment.
- At least one intended Camp Hope director must retain a `camp_members` row.
- `camp-documents` must exist and remain private.

## 1. Verify the release candidate

```bash
npm ci
python -m pip install openpyxl
npm run validate:env -- production .env.production.local
npm run verify
git status --short
```

The status must be clean. The GitHub `CI` workflow must pass on the exact commit
being promoted.

## 2. Capture the before-state

Use the production Supabase SQL editor. Save the result as the release receipt.

```sql
select c.id, c.slug, count(i.id) as historical_rows
from public.camps c
left join public.camp_registration_imports i on i.camp_id = c.id
where c.slug = 'camphope'
group by c.id, c.slug;

select c.slug, cm.role, count(*) as member_count
from public.camp_members cm
join public.camps c on c.id = cm.camp_id
where c.slug = 'camphope'
group by c.slug, cm.role
order by cm.role;
```

Stop if `historical_rows` is not 1,246 or the expected director is absent. Do
not re-import or guess at a replacement account.

Create a provider-native Supabase database backup or confirm a current backup
is restorable before applying migrations. Record its provider receipt.

## 3. Validate production configuration

Pull Vercel variables into a local ignored file, validate names and formats,
then archive only the validator output—not the file.

```bash
vercel env pull .env.production.local --environment=production
npm run validate:env -- production .env.production.local
```

Required production variables are documented in `.env.example`. The two Stripe
webhook variables belong to different endpoints and must not be copied from one
another:

- `STRIPE_WEBHOOK_SECRET` → `/api/stripe/webhook`
- `STRIPE_BILLING_WEBHOOK_SECRET` → `/api/billing/webhook`

Store secrets as sensitive/write-only values where Vercel supports it. Scope
live values to Production; Preview and Development use separate test-mode
values. Prefer a restricted live Stripe key with only the Checkout, Payment
Intent, Customer, Subscription, Billing Portal, Refund, and webhook reads/writes
the application uses. Both webhook routes verify Stripe signatures against the
raw request body; confirm a signed test delivery at each endpoint before launch.
Do not enable Stripe automatic tax until the business has registered and decided
where it must collect tax.

## 4. Apply migrations additively

First inspect the local/remote migration ledger. Then dry-run before the push.
Use a percent-encoded direct Postgres `DATABASE_URL`; never echo it into logs.

```bash
supabase migration list --db-url "$DATABASE_URL"
supabase db push --dry-run --db-url "$DATABASE_URL"
supabase db push --db-url "$DATABASE_URL"
supabase migration list --db-url "$DATABASE_URL"
```

The migration gate requires one file for every sequence with no duplicates or
gaps. On the consolidated release, `0000_core_schema.sql` creates missing legacy
core tables before `0001` applies tenancy/RLS, and security hardening follows at
`0021`. `0014_historical_imports.sql` is intentionally additive: if yesterday's table
already exists it preserves every row and re-asserts the private director-only
policy.

Apply during a quiet window. Review the dry-run for table rewrites or long locks;
do not continue if it differs from the checked-in sequence. RLS lookup columns
must remain indexed and grants must stay limited to the roles named in each
migration.

After the push, repeat the two before-state queries and verify the historical
count is still exactly 1,246.

## 5. Re-assert private storage and bootstrap access

```bash
node --env-file=.env.production.local --experimental-strip-types scripts/setup-storage.ts
node --env-file=.env.production.local --experimental-strip-types scripts/grant-access.ts <director-email> camphope director
```

`ops:storage` is idempotent and forces `camp-documents` back to `public: false`.
`ops:grant-access` invites an unknown address; use it only for the confirmed
recipient. Read back the membership in Supabase before continuing.

## 6. Promote through Vercel

Push the verified commit to `origin/main` and let the linked Vercel project build
that commit. Do not deploy a feature branch or a working tree with uncommitted
files. Record the Git commit and Vercel deployment id.

```bash
git push origin main
vercel inspect <production-deployment-url>
curl --fail --silent --show-error https://camperroster.com/api/health
```

`/api/health` must return HTTP 200 with `status: "healthy"` and
`db: "connected"`.

## 7. Independent live checks

Run these against production after the deployment:

1. Signed out: `/admin`, `/admin/history`, `/portal`, and document APIs must not
   reveal data.
2. Signed in as the confirmed Camp Hope director: `/admin/history` shows 1,246
   records; `Gallic` shows 102; `Theresa Gallic` and `Gallic Theresa` each show 5.
3. A punctuation-only search returns HTTP 400 and a malformed record id returns
   HTTP 400.
4. The `camp-documents` bucket is private and a document URL expires.
5. Create one Stripe test transaction before enabling live customer traffic;
   verify both the Stripe event and the matching database state.
6. Send one controlled mail item and verify the provider receipt plus queue state.

## Rollback

If application verification fails, use Vercel to promote the last known-good
deployment and record its deployment id. Do not reverse or delete migrations;
they are additive and older application releases ignore the added structures.
If a migration verification fails, stop customer traffic and restore through
the Supabase provider workflow rather than hand-editing participant rows.

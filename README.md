# CamperRoster

Registration, cabin assignment, paperwork, payments and communications for a
summer camp.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

### Environment

`.env.example` lists everything. The three that block startup:

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings — publishable, safe in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings — **bypasses row-level security**, server only |

There are no fallback values in the code. A missing variable fails the request
that needs it rather than silently connecting somewhere unexpected.

Before a production promotion, validate the complete payments, mail,
notification, and registration configuration without printing any values:

```bash
vercel env pull .env.production.local --environment=production
npm run validate:env -- production .env.production.local
```

### Database

Schema lives in `supabase/migrations/`, applied in filename order. The migration
gate rejects duplicate numbers, gaps, destructive table/schema drops, and
truncation. `0014_historical_imports.sql` preserves the private Camp Hope history
separately from current enrollment; reapplying it never replaces imported rows.

Reference data comes from `supabase/seed/camp_defaults.sql`: a season, the five
registration windows, the paperwork each population owes, the service areas, and
one cabin per grade and gender at the standard cap of 12. Edit the camp slug and
year at the top and run it; it is idempotent, and re-running adds nothing.

Without the cabins there is nowhere to place a camper and every registration
waitlists, so the seed creates them rather than leaving a director to add
fourteen by hand. Names and caps are a starting point, editable on the cabin
board.

The database holds no participant data. The campers, guardians and volunteers
that were in it were demo rows carried over from the marketing site, all with a
null `camp_id`, which meant row-level security hid them from everyone anyway.
They have been removed.

Pricing tiers are deliberately **not** seeded. Tuition is real money, so a
director enters the camp's published rates in the admin rather than inheriting a
guess.

### Getting the first person in

Row-level security means an account with no `camp_members` row sees nothing —
including the admin pages. A fresh database has no way in, so:

```bash
npm run ops:grant-access -- dave@camphope.org camphope director
```

An unknown email is invited and gets a link to set a password; a known one is
just given the membership. Camps can also sign themselves up at `/signup`, which
creates the camp and its first director in one go.

### Document storage

Scanned paperwork lives in a **private** Supabase Storage bucket,
`camp-documents`. Create it once per project:

```bash
npm run ops:storage
```

The script is idempotent, and it re-asserts `public: false` every run — if
someone flips the bucket public in the dashboard, running it again puts it back.

Nothing in the app ever builds a public URL for a document. `document_records`
stores the object *path*; a reader posts a record id to
`/api/documents/signed-url`, the route checks their role, reads the path back
through RLS, and mints a signed URL that expires in five minutes. The bulk zip
at `/api/documents/bulk-download` pulls the bytes server-side and never exposes
a path at all.

## How access works

Every table is scoped by `camp_id` and readable only through membership in
`camp_members`. The roles:

| Role | Sees |
| --- | --- |
| `director` | Everything |
| `registrar` | Registrations, cabins, paperwork, money |
| `nurse` | Medical records, medication administration |
| `red_shirt` | Compliance paperwork and background checks |
| `counselor` | Their roster |
| `staff` | Check-in and canteen |

Two rules the code holds to:

- **Staff pages query as the signed-in user.** Policies do the filtering, so a
  page cannot accidentally show a nurse the finance tab's data.
- **The service-role client is for work with no user session** — public
  registration intake, the Stripe webhook, scheduled jobs. It bypasses RLS
  entirely, so anywhere a user is signed in, use the request-scoped client from
  `src/lib/supabase/server.ts` instead.

Changes to participant data are recorded in `audit_log`, which has no update or
delete policy and so cannot be rewritten through the API.

## Layout

```
src/lib/auth.ts              role checks and page guards
src/lib/supabase/            browser, request-scoped, and service-role clients
src/lib/forms.ts             conditional-question evaluation and validation
src/app/admin/forms/         form builder — questions are data, not JSX
src/app/admin/cabins/        cabin board, capacity, waitlist
src/lib/documents.ts         uploads, signed URLs, review, what someone still owes
src/lib/insurance.ts         two-sided insurance card validation
src/lib/pdf.ts               minimal PDF writer (images -> one multi-page PDF)
src/lib/zip.ts               minimal ZIP writer for the nurse's binder download
src/app/admin/documents/     paperwork status, review queue, expiring credentials
src/app/api/documents/       upload, sign, review, signed-url, bulk-download
src/app/register/[audience]/ the public form each audience actually fills in
supabase/migrations/         schema
supabase/seed/               reference data
```

Placement, moves and waitlist promotion run as database functions that lock the
cabin row before counting, so two admins cannot be handed the same last bed.
Each function checks the caller's role itself, which is why they stay callable
by signed-in staff without being callable by anyone holding the publishable key.

## Deploys

`vercel.json` skips preview builds on `claude/*` branches. Agent branches push
work-in-progress commits often, and each one queued a build — including
checkpoints known not to compile. Production and every human-authored branch
deploy normally.

Vercel validates `vercel.json` against a strict schema and rejects any key it
does not recognise, so don't add a comment field to explain a setting — the
deployment fails on the config before it ever builds. Explain it here instead.

GitHub Actions runs the same verification command required locally. A skipped
Vercel preview is not proof; production promotion requires the `CI` workflow on
the exact commit plus the live checks in
[`docs/operations/production-runbook.md`](docs/operations/production-runbook.md).

Before pushing:

```bash
npm run verify
```

## Known issues

`npm audit` reports vulnerabilities reachable only through `next`'s bundled
`postcss` and `exceljs`'s bundled `uuid`. Both are build-time or
non-attacker-facing here, and neither is fixable without a breaking upgrade.
Worth revisiting when `next` ships a newer `postcss`.

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

### Database

Schema lives in `supabase/migrations/`, applied in filename order. `0001` is
deliberately absent: the original tables were created outside version control,
and that slot is reserved for a baseline dump of that starting state.

Reference data — a season, the five registration windows, the paperwork each
population owes, the service areas — comes from `supabase/seed/camp_defaults.sql`.
Edit the camp slug and year at the top and run it; it is idempotent.

Pricing tiers are deliberately **not** seeded. Tuition is real money, so a
director enters the camp's published rates in the admin rather than inheriting a
guess.

### Getting the first person in

Row-level security means an account with no `camp_members` row sees nothing —
including the admin pages. A fresh database has no way in, so:

```bash
npx tsx scripts/grant-access.ts dave@camphope.org camphope director
```

They then sign in at `/login`, which emails a link. There are no passwords.

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
src/app/register/[audience]/ the public form each audience actually fills in
supabase/migrations/         schema
supabase/seed/               reference data
```

Placement, moves and waitlist promotion run as database functions that lock the
cabin row before counting, so two admins cannot be handed the same last bed.
Each function checks the caller's role itself, which is why they stay callable
by signed-in staff without being callable by anyone holding the publishable key.

## Known issues

`npm audit` reports vulnerabilities reachable only through `next`'s bundled
`postcss` and `exceljs`'s bundled `uuid`. Both are build-time or
non-attacker-facing here, and neither is fixable without a breaking upgrade.
Worth revisiting when `next` ships a newer `postcss`.

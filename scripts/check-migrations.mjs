import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const directory = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(directory)
  .filter((name) => name.endsWith(".sql"))
  .sort();

assert.ok(files.length > 0, "No Supabase migrations found");

const expectedFiles = [
  "20260916020000_core_schema.sql",
  "20260916030241_tenancy_and_auth.sql",
  "20260916034301_billing.sql",
  "20260916034506_revoke_anon_residual_grants.sql",
  "20260916140406_roles_and_audit.sql",
  "20260916140451_families_and_seasons.sql",
  "20260916140532_registration_forms.sql",
  "20260916140629_cabins_and_waitlist.sql",
  "20260916140924_documents_and_compliance.sql",
  "20260916141027_payments.sql",
  "20260916141118_volunteer_teams.sql",
  "20260916141133_communications.sql",
  "20260916141214_view_and_function_hardening.sql",
  "20260916141244_revoke_placement_rpc_from_public.sql",
  "20260916141407_cabin_occupancy_add_sort_and_lead.sql",
  "20260916141431_placement_rpcs.sql",
  "20260916142415_payment_method_and_note.sql",
  "20260916143044_tidy_remaining_linter_warnings.sql",
  "20260916155914_stripe_events_per_handler.sql",
  "20260916160358_camps_location_optional.sql",
  "20260916163453_safety_approval_requires_a_decision.sql",
  "20260921120000_historical_imports.sql",
  "20260921121000_security_backend.sql",
];

assert.deepEqual(
  files,
  expectedFiles,
  "Migration files must match the production ledger plus the approved pending migrations",
);

const versions = files.map((name) => {
  const match = /^(\d{14})_[a-z0-9_]+\.sql$/.exec(name);
  assert.ok(match, `Migration filename is not canonical: ${name}`);
  return match[1];
});

assert.equal(new Set(versions).size, versions.length, "Migration versions must be unique");
for (let index = 1; index < versions.length; index += 1) {
  assert.ok(
    versions[index] > versions[index - 1],
    `Migration versions must be strictly increasing: ${versions[index - 1]} then ${versions[index]}`,
  );
}

for (const file of files) {
  const sql = readFileSync(join(directory, file), "utf8");
  assert.ok(sql.trim().length > 0, `${file} is empty`);
  assert.doesNotMatch(sql, /\bdrop\s+(?:table|schema|database)\b/i, `${file} contains destructive DDL`);
  assert.doesNotMatch(sql, /\btruncate\b/i, `${file} contains TRUNCATE`);
}

console.log(
  `PASS: ${files.length} additive migrations match the production ledger and approved pending versions ${versions[0]}-${versions.at(-1)}`,
);

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), "utf8");

const migrationName = readdirSync(join(root, "supabase/migrations")).find((name) => name.endsWith("_roster_import.sql"));

test("the import screen talks to the import API and no longer says imports are unavailable", () => {
  const client = read("src/app/admin/import/ImportClient.tsx");
  assert.ok(client.includes("/api/admin/import"));
  assert.doesNotMatch(client, /not available yet|Importer unavailable|stays on this device and will not be imported/i);
  assert.ok(client.includes("crypto.subtle"), "commit chunks carry a hashed idempotency key");
  assert.match(read("src/app/admin/import/page.tsx"), /requireArea\("admin"/);
});

test("the import route takes the camp from the session, never the body, and uses the caller's client", () => {
  const route = read("src/app/api/admin/import/route.ts");
  assert.match(route, /resolveCampWithRolesOrRespond\(\["registrar"\]\)/);
  assert.match(route, /p_camp_id: camp\.campId/);
  assert.doesNotMatch(route, /camp_id\s*:\s*z\./);
  assert.doesNotMatch(route, /body\.camp_?[iI]d|\bcampId\b\s*:\s*z\./);
  assert.doesNotMatch(route, /createAdminClient|supabaseAdmin|SERVICE_ROLE/);
  assert.match(route, /export const runtime = "nodejs"/);
  assert.match(route, /export const dynamic = "force-dynamic"/);
  assert.match(route, /MAX_BODY_BYTES/);
});

test("the roster import RPC is role-checked, pinned, granted only to authenticated, and never invoices", () => {
  assert.ok(migrationName, "roster import migration exists");
  const sql = read(`supabase/migrations/${migrationName}`);
  assert.match(sql, /security definer\s+set search_path = ''/i);
  assert.match(sql, /has_camp_role\(p_camp_id, array\['registrar'\]\)[\s\S]*?errcode = '42501'/);
  assert.match(sql, /revoke all on function public\.import_roster_rows\([^)]*\) from public, anon;/);
  assert.match(sql, /grant execute on function public\.import_roster_rows\([^)]*\) to authenticated;/);
  assert.match(sql, /on conflict \(camper_id\)/);
  assert.match(sql, /unique \(camp_id, idempotency_key\)/);
  assert.match(sql, /enable row level security/);
  assert.doesNotMatch(sql, /insert into public\.family_invoices/i);
  assert.doesNotMatch(sql, /payment_schedule_items/i);
  assert.doesNotMatch(sql, /create_registration_intake/i);
});

test("marketing pages no longer say roster imports are unavailable", () => {
  const files = [
    "src/app/page.tsx",
    "src/app/pricing/page.tsx",
    "src/app/ultracamp-alternative/Content.tsx",
    "src/app/campminder-alternative/Content.tsx",
    "src/app/campbrain-alternative/Content.tsx",
  ];
  for (const file of files) {
    assert.doesNotMatch(read(file), /automatic imports? (?:are|is) not available|no automatic import/i, file);
  }
});

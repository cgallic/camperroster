import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./env.ts", import.meta.url), "utf8");

test("browser-exposed Supabase env vars use literal references Next.js can inline", () => {
  assert.match(source, /process\.env\.NEXT_PUBLIC_SUPABASE_URL\b/);
  assert.match(source, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY\b/);
  assert.doesNotMatch(source, /process\.env\[/);
});

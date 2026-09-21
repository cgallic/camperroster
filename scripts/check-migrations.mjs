import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const directory = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(directory)
  .filter((name) => name.endsWith(".sql"))
  .sort();

assert.ok(files.length > 0, "No Supabase migrations found");

const versions = files.map((name) => {
  const match = /^(\d{4})_[a-z0-9_]+\.sql$/.exec(name);
  assert.ok(match, `Migration filename is not canonical: ${name}`);
  return Number(match[1]);
});

assert.equal(new Set(versions).size, versions.length, "Migration versions must be unique");
const firstVersion = versions[0];
assert.ok(firstVersion === 0 || firstVersion === 1, "Migration sequence must begin at 0000 or 0001");
for (let index = 0; index < versions.length; index += 1) {
  assert.equal(
    versions[index],
    firstVersion + index,
    `Migration sequence must be contiguous; expected ${(firstVersion + index).toString().padStart(4, "0")}`,
  );
}

for (const file of files) {
  const sql = readFileSync(join(directory, file), "utf8");
  assert.ok(sql.trim().length > 0, `${file} is empty`);
  assert.doesNotMatch(sql, /\bdrop\s+(?:table|schema|database)\b/i, `${file} contains destructive DDL`);
  assert.doesNotMatch(sql, /\btruncate\b/i, `${file} contains TRUNCATE`);
}

console.log(`PASS: ${files.length} additive migrations are uniquely numbered ${firstVersion.toString().padStart(4, "0")}-${versions.at(-1).toString().padStart(4, "0")}`);

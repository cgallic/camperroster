import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const clients = [
  "src/app/admin/checkin/CheckinClient.tsx",
  "src/app/admin/bunk-notes/BunkNotesClient.tsx",
  "src/app/nurse/emar/EmarClient.tsx",
  "src/app/counselor/CounselorRosterClient.tsx",
  "src/app/canteen/pos/CanteenPosClient.tsx",
];

test("operational clients contain no former demo people or fake phone numbers", async () => {
  const source = (await Promise.all(clients.map((file) => readFile(file, "utf8")))).join("\n");
  for (const demoValue of ["Jamie Gallic", "Emma Gallic", "Tyler Reed", "Maya Ruiz", "Lucas Rivera", "(555)"]) {
    assert.equal(source.includes(demoValue), false, `found demo value: ${demoValue}`);
  }
});

test("each operational client reads from its authenticated application API", async () => {
  const expected = new Map([
    [clients[0], "/api/admin/checkin"],
    [clients[1], "/api/portal/bunk-notes"],
    [clients[2], "/api/nurse/emar"],
    [clients[3], "/api/counselor/roster"],
    [clients[4], "/api/canteen/roster"],
  ]);
  for (const [file, endpoint] of expected) {
    const source = await readFile(file, "utf8");
    assert.ok(source.includes(endpoint), `${file} must use ${endpoint}`);
  }
});

test("canteen records an audited wallet mutation instead of a fake local checkout", async () => {
  const source = await readFile(clients[4], "utf8");
  assert.ok(source.includes("/api/portal/canteen"));
  assert.ok(source.includes("idempotency-key"));
  assert.equal(source.includes("Choco Taco"), false);
  assert.equal(source.includes("live Supabase ledger"), false);
});

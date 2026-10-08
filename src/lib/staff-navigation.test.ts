import assert from "node:assert/strict";
import test from "node:test";

import { navigationForRole, STAFF_NAVIGATION } from "./staff-navigation.ts";

function hrefs(role: Parameters<typeof navigationForRole>[0]) {
  return navigationForRole(role).map((item) => item.href);
}

test("directors can discover every signed-in operational module", () => {
  assert.deepEqual(hrefs("director"), [
    "/admin",
    "/admin/intake",
    "/admin/forms",
    "/admin/cabins",
    "/admin/history",
    "/admin/finance",
    "/admin/documents",
    "/admin/exports",
    "/nurse/emar",
    "/counselor",
    "/canteen/pos",
    "/admin/mail",
    "/admin/bunk-notes",
    "/admin/checkin",
    "/admin/staff",
    "/admin/activity",
    "/admin/settings",
    "/admin/camps/new",
    "/billing",
  ]);
});

test("registrars see operational tools but not director-only account controls", () => {
  const registrar = hrefs("registrar");
  assert.ok(registrar.includes("/admin"));
  assert.ok(registrar.includes("/admin/intake"));
  assert.ok(!registrar.includes("/admin/history"));
  assert.ok(registrar.includes("/counselor"));
  assert.ok(registrar.includes("/canteen/pos"));
  assert.ok(!registrar.includes("/nurse/emar"));
  assert.ok(!registrar.includes("/admin/staff"));
  assert.ok(!registrar.includes("/billing"));
});

test("specialist roles only see destinations admitted by their area guards", () => {
  assert.deepEqual(hrefs("nurse"), ["/nurse/emar", "/counselor"]);
  assert.deepEqual(hrefs("counselor"), ["/counselor", "/canteen/pos"]);
  assert.deepEqual(hrefs("red_shirt"), ["/counselor"]);
  assert.deepEqual(hrefs("staff"), ["/counselor", "/canteen/pos", "/admin/checkin"]);
});

test("every role lands on a page it can open", async () => {
  const { homeForRole } = await import("./staff-navigation.ts");
  assert.equal(homeForRole("director"), "/admin");
  assert.equal(homeForRole("registrar"), "/admin");
  assert.equal(homeForRole("nurse"), "/nurse/emar");
  assert.equal(homeForRole("staff"), "/counselor");
  assert.equal(homeForRole("counselor"), "/counselor");
  assert.equal(homeForRole("red_shirt"), "/counselor");
});

test("grouped pages sit next to each other so each sub-menu is one block", () => {
  const groups = STAFF_NAVIGATION.map((item) => item.group ?? item.href);
  const seen = new Set<string>();
  groups.forEach((group, index) => {
    if (index > 0 && groups[index - 1] === group) return;
    assert.ok(!seen.has(group), `${group} is split in two`);
    seen.add(group);
  });
});

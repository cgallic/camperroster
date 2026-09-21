import assert from "node:assert/strict";
import test from "node:test";

import { navigationForRole } from "./staff-navigation.ts";

function hrefs(role: Parameters<typeof navigationForRole>[0]) {
  return navigationForRole(role).map((item) => item.href);
}

test("directors can discover every signed-in operational module", () => {
  assert.deepEqual(hrefs("director"), [
    "/admin",
    "/admin/intake",
    "/admin/forms",
    "/admin/checkin",
    "/admin/cabins",
    "/admin/documents",
    "/admin/bunk-notes",
    "/nurse/emar",
    "/counselor",
    "/canteen/pos",
    "/admin/mail",
    "/admin/finance",
    "/admin/exports",
    "/admin/history",
    "/admin/staff",
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
  assert.deepEqual(hrefs("staff"), ["/admin/checkin", "/counselor", "/canteen/pos"]);
});

import assert from "node:assert/strict";
import test from "node:test";

import { isTrackedPath } from "./analytics.ts";

test("public marketing and signup pages are tracked", () => {
  for (const path of ["/", "/pricing", "/demo", "/signup", "/start", "/campdoc-alternative", "/camp-health-records-software", "/blog/x"]) {
    assert.equal(isTrackedPath(path), true, path);
  }
});

test("pages with camper, family, health or staff data are never tracked", () => {
  for (const path of ["/admin", "/admin/campers", "/nurse/emar", "/portal", "/register/abc", "/c/camphope/register", "/volunteer/apply", "/auth/callback", "/billing"]) {
    assert.equal(isTrackedPath(path), false, path);
  }
});

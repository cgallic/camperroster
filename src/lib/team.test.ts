import assert from "node:assert/strict";
import test from "node:test";

import { lastDirectorProblem, roleLabel, ROLE_DETAILS } from "./team.ts";
const ROLES = ["director", "registrar", "nurse", "red_shirt", "counselor", "staff"];

test("every camp role has a description on the Team access page", () => {
  assert.deepEqual(ROLE_DETAILS.map((item) => item.role).sort(), [...ROLES].sort());
});

test("the only director cannot be demoted or removed", () => {
  const members = [{ userId: "a", role: "director" }, { userId: "b", role: "nurse" }];
  assert.match(lastDirectorProblem(members, "a", "registrar") ?? "", /at least one director/);
  assert.match(lastDirectorProblem(members, "a", null) ?? "", /at least one director/);
});

test("a director can be demoted while another director remains", () => {
  const members = [{ userId: "a", role: "director" }, { userId: "b", role: "director" }];
  assert.equal(lastDirectorProblem(members, "a", "registrar"), null);
  assert.equal(lastDirectorProblem(members, "a", null), null);
});

test("non-directors can always change role", () => {
  const members = [{ userId: "a", role: "director" }, { userId: "b", role: "nurse" }];
  assert.equal(lastDirectorProblem(members, "b", "registrar"), null);
  assert.equal(lastDirectorProblem(members, "b", "director"), null);
});

test("role labels read like words", () => {
  assert.equal(roleLabel("red_shirt"), "Red shirt");
});

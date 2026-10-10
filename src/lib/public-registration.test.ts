import test from "node:test";
import assert from "node:assert/strict";
import {
  FAMILY_AUDIENCES,
  VOLUNTEER_AUDIENCES,
  chooseSessionId,
  periodFormLinks,
  registrationDraftKey,
} from "./public-registration.ts";

const sessions = [{ id: "junior" }, { id: "senior" }];

test("deep-linked session is selected when there is no current valid choice", () => {
  assert.equal(chooseSessionId(sessions, "", "senior"), "senior");
});

test("stale or foreign session ids cannot survive a camp change", () => {
  assert.equal(chooseSessionId(sessions, "another-camp-session", "also-invalid"), "junior");
});

test("a camp with no published sessions gets no fabricated fallback", () => {
  assert.equal(chooseSessionId([], "session-1", "session-2"), "");
});

test("draft storage is isolated by tenant slug", () => {
  assert.notEqual(registrationDraftKey("camp-a"), registrationDraftKey("camp-b"));
});

const now = new Date("2026-10-10T12:00:00Z");
const period = (audience: string, extra: Record<string, unknown> = {}) => ({
  audience,
  opensAt: null,
  closesAt: null,
  visibility: "public",
  ...extra,
});

test("period links point at the per-audience form for that camp only", () => {
  const links = periodFormLinks("camphope", [period("new_family"), period("returning_family")], FAMILY_AUDIENCES, now);
  assert.deepEqual(links.map((l) => l.href), [
    "/register/returning_family?camp=camphope",
    "/register/new_family?camp=camphope",
  ]);
});

test("audiences without a public, unexpired period get no button", () => {
  const links = periodFormLinks(
    "camphope",
    [
      period("returning_adult", { visibility: "link_only" }),
      period("new_adult", { closesAt: "2026-10-01T00:00:00Z" }),
      period("teen_volunteer"),
    ],
    VOLUNTEER_AUDIENCES,
    now,
  );
  assert.deepEqual(links.map((l) => l.audience), ["teen_volunteer"]);
});

test("a period that has not opened yet carries its open date", () => {
  const [future] = periodFormLinks("camphope", [period("new_family", { opensAt: "2027-01-15T14:00:00Z" })], FAMILY_AUDIENCES, now);
  const [open] = periodFormLinks("camphope", [period("new_family", { opensAt: "2026-09-01T00:00:00Z" })], FAMILY_AUDIENCES, now);
  assert.equal(future.opensAt, "2027-01-15T14:00:00Z");
  assert.equal(open.opensAt, null);
});

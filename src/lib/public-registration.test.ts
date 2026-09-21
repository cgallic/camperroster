import test from "node:test";
import assert from "node:assert/strict";
import { chooseSessionId, registrationDraftKey } from "./public-registration.ts";

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

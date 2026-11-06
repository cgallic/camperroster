import assert from "node:assert/strict";
import test from "node:test";

import { canViewPeriod } from "./forms.ts";
import { hashInviteToken, invitePath, newInviteToken } from "./registration-invites.ts";

const NOW = new Date("2027-03-01T12:00:00Z");
const openPeriod = { visibility: "public" as const, opens_at: null, closes_at: null, access_token: null };
const closedPeriod = { ...openPeriod, visibility: "closed" as const };
const expiredPeriod = { ...openPeriod, closes_at: "2027-02-01T00:00:00Z" };
const linkOnly = { ...openPeriod, visibility: "link_only" as const, access_token: "period-secret" };

test("the switch left on changes nothing", () => {
  assert.equal(canViewPeriod(openPeriod, null, NOW, { campOpen: true }), true);
  assert.equal(canViewPeriod(closedPeriod, null, NOW, { campOpen: true }), false);
  assert.equal(canViewPeriod(openPeriod, null, NOW), true);
});

test("the switch turned off closes open forms and period links alike", () => {
  assert.equal(canViewPeriod(openPeriod, null, NOW, { campOpen: false }), false);
  assert.equal(canViewPeriod(linkOnly, "period-secret", NOW, { campOpen: false }), false);
});

test("a live personal invite opens the form whatever the switch, window or visibility say", () => {
  for (const period of [openPeriod, closedPeriod, expiredPeriod, linkOnly]) {
    assert.equal(canViewPeriod(period, "anything", NOW, { campOpen: false, invited: true }), true);
  }
});

test("invite tokens are random and only their hash is comparable", () => {
  const a = newInviteToken();
  const b = newInviteToken();
  assert.notEqual(a, b);
  assert.ok(a.length >= 32);
  assert.match(hashInviteToken(a), /^[0-9a-f]{64}$/);
  assert.equal(hashInviteToken(a), hashInviteToken(a));
  assert.notEqual(hashInviteToken(a), hashInviteToken(b));
});

test("invite links carry the camp slug the public form requires", () => {
  assert.equal(invitePath("new_family", "camphope", "tok_1"), "/register/new_family?camp=camphope&token=tok_1");
});

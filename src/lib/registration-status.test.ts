import test from "node:test";
import assert from "node:assert/strict";

import {
  PROVISIONAL_HOLD_MESSAGE,
  evaluateRegistration,
  isPaidInFull,
  outstandingChecklist,
  timingFromDays,
  whoCategory,
} from "./registration-status.ts";

const FORMS_DUE = "2026-07-01";
const BEFORE = new Date("2026-06-15T12:00:00");
const ON_THE_DAY = new Date("2026-07-01T12:00:00");
const AFTER = new Date("2026-07-02T12:00:00");

const allApproved = { requiredTotal: 4, requiredApproved: 4, requiredOutstanding: 0 };
const someOutstanding = { requiredTotal: 4, requiredApproved: 2, requiredOutstanding: 2 };

test("complete needs every required document approved AND payment in full", () => {
  assert.equal(
    evaluateRegistration({
      documents: allApproved,
      totalDueCents: 65000,
      amountPaidCents: 65000,
      formsDueOn: FORMS_DUE,
      today: BEFORE,
    }).status,
    "complete"
  );

  // Paperwork done, money still owed: not complete.
  assert.equal(
    evaluateRegistration({
      documents: allApproved,
      totalDueCents: 65000,
      amountPaidCents: 20000,
      formsDueOn: FORMS_DUE,
      today: BEFORE,
    }).status,
    "pending"
  );

  // Money done, paperwork still owed: not complete either.
  assert.equal(
    evaluateRegistration({
      documents: someOutstanding,
      totalDueCents: 65000,
      amountPaidCents: 65000,
      formsDueOn: FORMS_DUE,
      today: BEFORE,
    }).status,
    "pending"
  );
});

test("the deadline splits pending from overdue, and the deadline day still counts as pending", () => {
  const base = {
    documents: someOutstanding,
    totalDueCents: 65000,
    amountPaidCents: 0,
    formsDueOn: FORMS_DUE,
  };

  assert.equal(evaluateRegistration({ ...base, today: BEFORE }).status, "pending");
  assert.equal(evaluateRegistration({ ...base, today: ON_THE_DAY }).status, "pending");
  assert.equal(evaluateRegistration({ ...base, today: AFTER }).status, "overdue");
});

test("an extension outranks the deadline but not a finished registration", () => {
  assert.equal(
    evaluateRegistration({
      documents: someOutstanding,
      totalDueCents: 65000,
      amountPaidCents: 0,
      formsDueOn: FORMS_DUE,
      rawStatus: "extension_granted",
      today: AFTER,
    }).status,
    "extension_granted"
  );

  assert.equal(
    evaluateRegistration({
      documents: someOutstanding,
      formsDueOn: FORMS_DUE,
      extensionGranted: true,
      today: AFTER,
    }).status,
    "extension_granted"
  );
});

test("the provisional-hold wording appears only while something is outstanding", () => {
  const incomplete = evaluateRegistration({
    documents: someOutstanding,
    totalDueCents: 65000,
    amountPaidCents: 0,
    formsDueOn: FORMS_DUE,
    today: BEFORE,
  });
  assert.equal(incomplete.provisionalHoldMessage, PROVISIONAL_HOLD_MESSAGE);

  const done = evaluateRegistration({
    documents: allApproved,
    totalDueCents: 65000,
    amountPaidCents: 65000,
    formsDueOn: FORMS_DUE,
    today: BEFORE,
  });
  assert.equal(done.provisionalHoldMessage, null);
  assert.deepEqual(done.outstanding, []);
});

test("the checklist names the documents when it has them, and the balance last", () => {
  const items = outstandingChecklist({
    outstandingDocuments: [
      { code: "insurance", name: "Insurance card (PDF)", status: "missing" },
      { code: "liability", name: "Liability form", status: "submitted" },
    ],
    totalDueCents: 65000,
    amountPaidCents: 40000,
  });

  assert.deepEqual(items, [
    "Insurance card (PDF)",
    "Liability form (submitted)",
    "Balance of $250.00 still due",
  ]);
});

test("paid in full", () => {
  assert.equal(isPaidInFull(65000, 65000), true);
  assert.equal(isPaidInFull(65000, 65001), true);
  assert.equal(isPaidInFull(65000, 64999), false);
  // Nothing invoiced is nothing owed.
  assert.equal(isPaidInFull(0, 0), true);
});

test("who buckets, with the waitlist winning", () => {
  assert.equal(whoCategory({ population: "camper", isReturning: true, isWaitlisted: false }), "returning_family");
  assert.equal(whoCategory({ population: "camper", isReturning: false, isWaitlisted: false }), "new_family");
  assert.equal(whoCategory({ population: "camper", isReturning: true, isWaitlisted: true }), "waitlisted_camper");
  assert.equal(
    whoCategory({ population: "teen_volunteer", isReturning: false, isWaitlisted: false }),
    "new_teen_counselor"
  );
  assert.equal(
    whoCategory({ population: "adult_volunteer", isReturning: true, isWaitlisted: true }),
    "waitlisted_volunteer"
  );
});

test("timing reads back the half-week choice from the days served", () => {
  const week = ["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10", "2026-07-11"];
  assert.equal(timingFromDays(week, week), "full_week");
  assert.equal(timingFromDays(week.slice(0, 3), week), "first_half");
  assert.equal(timingFromDays(week.slice(3), week), "second_half");
  assert.equal(timingFromDays([], week), "unknown");
});

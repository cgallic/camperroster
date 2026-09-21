import assert from "node:assert/strict";
import test from "node:test";
import { ageOnDate, formatMoney, medicationWindow, safeApiMessage } from "./operations.ts";

test("formatMoney renders ledger cents without floating-point input", () => {
  assert.equal(formatMoney(3450), "$34.50");
  assert.equal(formatMoney(0), "$0.00");
});

test("medicationWindow assigns every scheduled hour to an operational round", () => {
  assert.equal(medicationWindow("2026-07-01T08:00:00"), "breakfast");
  assert.equal(medicationWindow("2026-07-01T12:00:00"), "lunch");
  assert.equal(medicationWindow("2026-07-01T18:00:00"), "dinner");
  assert.equal(medicationWindow("2026-07-01T21:00:00"), "bedtime");
});

test("ageOnDate handles birthdays and missing values", () => {
  const reference = new Date("2026-07-01T12:00:00Z");
  assert.equal(ageOnDate("2016-06-30", reference), 10);
  assert.equal(ageOnDate("2016-07-02", reference), 9);
  assert.equal(ageOnDate(null, reference), null);
});

test("safeApiMessage prefers a useful server message", () => {
  assert.equal(safeApiMessage({ message: "Sign in to continue." }, "Failed"), "Sign in to continue.");
  assert.equal(safeApiMessage({ error: "Wallet is unavailable." }, "Failed"), "Wallet is unavailable.");
  assert.equal(safeApiMessage({ error: "setup_incomplete" }, "Failed"), "Failed");
});

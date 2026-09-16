/**
 * Run with:  node --test src/lib/pricing.test.ts
 *
 * These cover the two things that quietly cost real money if they are wrong:
 * the fee gross-up, and schedules that do not add back up to the invoice.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  addMonths,
  buildSchedule,
  grossUpCents,
  monthsBetween,
  processingFeeCents,
  rateInForce,
  scheduleTotalCents,
  splitCents,
  stripeFeeOnCharge,
  tierPriceCents,
} from "./pricing.ts";

test("gross-up leaves the camp whole, unlike a naive markup", () => {
  const net = 50_000; // $500 tuition
  const gross = grossUpCents(net);

  // (500 + 0.30) / 0.971 = 515.2420... -> 51525 cents, rounded up
  assert.equal(gross, 51_525);

  // The camp nets at least the tuition once Stripe takes its cut.
  assert.ok(gross - stripeFeeOnCharge(gross) >= net);

  // The naive version does not: 50000 * 1.029 = 51450, which nets $499.56.
  const naive = Math.round(net * 1.029);
  assert.ok(naive - stripeFeeOnCharge(naive) < net);
});

test("processing fee is the difference, and zero for nothing owed", () => {
  assert.equal(processingFeeCents(50_000), 1_525);
  assert.equal(processingFeeCents(0), 0);
  assert.equal(processingFeeCents(-100), 0);
});

test("early rate applies strictly before the switchover date", () => {
  assert.equal(rateInForce("2026-03-31", "2026-04-01"), "early");
  assert.equal(rateInForce("2026-04-01", "2026-04-01"), "regular");
  assert.equal(rateInForce("2026-04-02", "2026-04-01"), "regular");
  assert.equal(rateInForce("2026-01-01", null), "regular");

  const tier = { early_cents: 40_000, regular_cents: 45_000 };
  assert.equal(tierPriceCents(tier, "2026-03-31", "2026-04-01"), 40_000);
  assert.equal(tierPriceCents(tier, "2026-04-01", "2026-04-01"), 45_000);
});

test("splitCents never loses or invents a cent", () => {
  assert.deepEqual(splitCents(100, 3), [34, 33, 33]);
  assert.equal(splitCents(50_001, 7).reduce((a, b) => a + b, 0), 50_001);
  assert.deepEqual(splitCents(500, 1), [500]);
});

test("addMonths clamps to the end of a short month", () => {
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2026-12-15", 1), "2027-01-15");
  assert.equal(monthsBetween("2026-01-15", "2026-06-10"), 4);
  assert.equal(monthsBetween("2026-01-15", "2026-06-15"), 5);
});

test("pay in full is one item due today", () => {
  const items = buildSchedule({
    plan: "pay_in_full",
    totalCents: 51_525,
    today: "2026-02-01",
    campStartsOn: "2026-07-06",
  });
  assert.deepEqual(items, [{ dueOn: "2026-02-01", amountCents: 51_525 }]);
});

test("two payments are halves, the second before camp", () => {
  const items = buildSchedule({
    plan: "two_payments",
    totalCents: 50_001,
    today: "2026-02-01",
    campStartsOn: "2026-07-06",
  });
  assert.equal(items.length, 2);
  assert.deepEqual(items.map((i) => i.amountCents), [25_001, 25_000]);
  assert.equal(items[1].dueOn, "2026-07-05");
  assert.equal(scheduleTotalCents(items), 50_001);
});

test("monthly instalments all fall due before camp and sum to the total", () => {
  const items = buildSchedule({
    plan: "monthly",
    totalCents: 50_000,
    today: "2026-02-01",
    campStartsOn: "2026-07-06",
  });
  assert.equal(items.length, 6); // Feb through July 1, last before July 5
  assert.equal(scheduleTotalCents(items), 50_000);
  assert.ok(items.every((i) => i.dueOn < "2026-07-06"));
});

test("a late registration on any plan collapses to one payment", () => {
  for (const plan of ["two_payments", "monthly"] as const) {
    const items = buildSchedule({
      plan,
      totalCents: 45_000,
      today: "2026-07-05",
      campStartsOn: "2026-07-06",
    });
    assert.equal(items.length, 1);
    assert.equal(items[0].amountCents, 45_000);
  }
});

test("a zero-balance invoice schedules nothing", () => {
  assert.deepEqual(buildSchedule({ plan: "monthly", totalCents: 0, today: "2026-02-01" }), []);
});

import assert from "node:assert/strict";
import test from "node:test";

import { buildTriageItems, campersDisplayCount, volsDisplayCount } from "./triage.ts";

test("dashboard counts are exact and never padded with demo totals", () => {
  assert.equal(campersDisplayCount(0), 0);
  assert.equal(campersDisplayCount(12), 12);
  assert.equal(campersDisplayCount(null), 0);
  assert.equal(volsDisplayCount(0), 0);
  assert.equal(volsDisplayCount(7), 7);
  assert.equal(volsDisplayCount(null), 0);
});

test("triage rows do not invent people or medical facts", () => {
  const [medical, reference] = buildTriageItems(
    [{ id: "health-1", camper_id: "camper-1", campers: null, allergy_details: null }],
    [{ id: "ref-1", staff_applications: null, reference_name: null, sentiment_score: null }],
  );

  assert.equal(medical.title, "Camper record camper-1");
  assert.equal(medical.sub, "Camper");
  assert.equal(medical.detail, "Allergy details not provided");
  assert.equal(reference.title, "Staff application");
  assert.equal(reference.detail, "Unnamed reference call (not scored)");
});

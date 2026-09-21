import assert from "node:assert/strict";
import test from "node:test";

import { humanizeIntakeValue, matchesIntakeSearch, searchableAnswerText } from "./intake.ts";

test("intake search is case-insensitive and spans contact and status values", () => {
  assert.equal(matchesIntakeSearch(["Jordan Lee", "jordan@example.com", "Submitted"], "EXAMPLE.COM"), true);
  assert.equal(matchesIntakeSearch(["Jordan Lee", "jordan@example.com", "Submitted"], "approved"), false);
  assert.equal(matchesIntakeSearch(["Jordan Lee"], "  "), true);
});

test("custom form answers remain searchable even when they are not linked to a roster row", () => {
  const text = searchableAnswerText([
    { label: "Full name", value: "Taylor Morgan" },
    { label: "Church", value: "First Community" },
  ]);
  assert.equal(matchesIntakeSearch([text], "community"), true);
});

test("answer values are rendered without losing false or multi-select values", () => {
  assert.equal(humanizeIntakeValue(false), "No");
  assert.equal(humanizeIntakeValue(true), "Yes");
  assert.equal(humanizeIntakeValue(["Kitchen", "Waterfront"]), "Kitchen, Waterfront");
  assert.equal(humanizeIntakeValue(null), "Not answered");
});


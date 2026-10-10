import assert from "node:assert/strict";
import test from "node:test";

import { placementOf } from "./cabin-placement.ts";

test("cabin and lead counselor come from the cabin board's assignment", () => {
  const row = {
    cabin_id: null,
    cabin_name: null,
    counselor_name: null,
    cabin_assignments: [
      { cabin_id: "cab-1", cabins: { id: "cab-1", name: "Cedar", staff_applications: { first_name: "Sam", last_name: "Ruiz" } } },
    ],
  };
  assert.deepEqual(placementOf(row), { cabinId: "cab-1", cabinName: "Cedar", counselorName: "Sam Ruiz" });
});

test("an unreadable lead counselor or a missing assignment falls back to the legacy columns", () => {
  const hidden = { cabin_assignments: { cabin_id: "cab-1", cabins: { id: "cab-1", name: "Cedar", staff_applications: null } } };
  assert.deepEqual(placementOf(hidden), { cabinId: "cab-1", cabinName: "Cedar", counselorName: null });

  const legacy = { cabin_id: "old", cabin_name: "Pine", counselor_name: "Jo", cabin_assignments: [] };
  assert.deepEqual(placementOf(legacy), { cabinId: "old", cabinName: "Pine", counselorName: "Jo" });
});

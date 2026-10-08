import assert from "node:assert/strict";
import test from "node:test";

import {
  actionLabel,
  activityHref,
  actorLabel,
  areaLabel,
  dateBounds,
  describeChanges,
  formatValue,
  pageRange,
  parseActivityFilters,
  personMatch,
} from "./activity.ts";

test("tables and actions read as plain words", () => {
  assert.equal(areaLabel("camp_members"), "Team access");
  assert.equal(areaLabel("registrations"), "Registration");
  assert.equal(areaLabel("some_new_table"), "Some new table");
  assert.equal(actionLabel("INSERT"), "Added");
  assert.equal(actionLabel("UPDATE"), "Changed");
  assert.equal(actionLabel("DELETE"), "Removed");
  assert.equal(actorLabel(null), "System");
  assert.equal(actorLabel("dana@camp.org"), "dana@camp.org");
});

test("updates show from/to pairs as record_audit stores them", () => {
  const lines = describeChanges("registrations", "UPDATE", {
    status: { from: "pending", to: "confirmed" },
    amount_paid_cents: { from: 0, to: 12500 },
    updated_at: { from: "2026-01-01", to: "2026-01-02" },
  });
  assert.deepEqual(lines, [
    { field: "amount_paid_cents", label: "Amount paid", redacted: false, from: "$0.00", to: "$125.00" },
    { field: "status", label: "Status", redacted: false, from: "pending", to: "confirmed" },
  ]);
});

test("an update stored as a bare value is shown as the new value", () => {
  const [line] = describeChanges("cabins", "UPDATE", { name: "Pines" });
  assert.equal(line.from, "empty");
  assert.equal(line.to, "Pines");
});

test("inserts and deletes list the non-blank columns of the row", () => {
  const added = describeChanges("campers", "INSERT", { id: "x", camp_id: "y", legal_first_name: "Ada", photo_url: null });
  assert.deepEqual(added, [{ field: "legal_first_name", label: "Legal first name", redacted: false, to: "Ada" }]);
  const removed = describeChanges("cabins", "DELETE", { name: "Oaks", is_open: true });
  assert.deepEqual(removed.map((l) => [l.label, l.from, l.to]), [["Is open", "Yes", undefined], ["Name", "Oaks", undefined]]);
});

test("sensitive tables never expose values", () => {
  for (const table of ["health_profiles", "insurance_policies", "staff_references", "emar_logs", "medications"]) {
    const lines = [
      ...describeChanges(table, "UPDATE", { notes: { from: "asthma", to: "asthma, peanuts" } }),
      ...describeChanges(table, "INSERT", { notes: "asthma" }),
      ...describeChanges(table, "DELETE", { notes: "asthma" }),
    ];
    assert.equal(lines.length, 3);
    for (const line of lines) {
      assert.equal(line.redacted, true, table);
      assert.equal(line.from, undefined);
      assert.equal(line.to, undefined);
      assert.ok(!JSON.stringify(line).includes("asthma"));
    }
  }
});

test("secret and background-check columns are redacted on any table", () => {
  const lines = describeChanges("staff_invitations", "INSERT", { token_sha256: "abc123", email: "a@b.co" });
  assert.deepEqual(lines, [
    { field: "email", label: "Email", redacted: false, to: "a@b.co" },
    { field: "token_sha256", label: "Token sha256", redacted: true },
  ]);
  const bg = describeChanges("staff_applications", "UPDATE", {
    background_status: { from: "pending", to: "flagged" },
    background_check_id: { from: null, to: "chk_9" },
  });
  assert.ok(bg.every((l) => l.redacted && l.from === undefined && l.to === undefined));
});

test("values are short and readable", () => {
  assert.equal(formatValue("notes", "x".repeat(200)).length, 60);
  assert.ok(formatValue("notes", "x".repeat(200)).endsWith("…"));
  assert.equal(formatValue("checked_in", false), "No");
  assert.equal(formatValue("cabin_id", null), "empty");
  assert.equal(formatValue("tags", ["a", "b"]), "a, b");
  assert.equal(formatValue("meta", { a: 1 }), '{"a":1}');
  assert.deepEqual(describeChanges("cabins", "UPDATE", "not an object"), []);
});

test("filters keep only values the query can trust", () => {
  assert.deepEqual(parseActivityFilters({}), { area: null, person: "", from: null, to: null, page: 1 });
  assert.deepEqual(
    parseActivityFilters({ area: "camp_members", person: " dana ", from: "2026-06-01", to: "2026-06-30", page: "3" }),
    { area: "camp_members", person: "dana", from: "2026-06-01", to: "2026-06-30", page: 3 },
  );
  const junk = parseActivityFilters({ area: "toString", from: "2026-02-30", to: "yesterday", page: "-4" });
  assert.equal(junk.area, null);
  assert.equal(junk.from, null);
  assert.equal(junk.to, null);
  assert.equal(junk.page, 1);
  assert.equal(parseActivityFilters({ area: ["cabins", "campers"] }).area, "cabins");
});

test("date range is inclusive of the end day", () => {
  assert.deepEqual(dateBounds({ from: "2026-06-01", to: "2026-06-30" }), {
    gte: "2026-06-01T00:00:00.000Z",
    lt: "2026-07-01T00:00:00.000Z",
  });
  assert.deepEqual(dateBounds({ from: null, to: null }), {});
});

test("person filter escapes wildcards and understands System", () => {
  assert.deepEqual(personMatch(""), { kind: "none" });
  assert.deepEqual(personMatch("System"), { kind: "system" });
  assert.deepEqual(personMatch("a_b%"), { kind: "ilike", pattern: "%a\\_b\\%%" });
});

test("pagination and links", () => {
  assert.deepEqual(pageRange(1), [0, 49]);
  assert.deepEqual(pageRange(3), [100, 149]);
  const filters = parseActivityFilters({ area: "cabins", person: "dana" });
  assert.equal(activityHref(filters, { page: 2 }), "/admin/activity?area=cabins&person=dana&page=2");
  assert.equal(activityHref(parseActivityFilters({})), "/admin/activity");
});

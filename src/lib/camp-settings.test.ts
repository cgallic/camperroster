import assert from "node:assert/strict";
import test from "node:test";

import {
  centsToDollars,
  dollarsToCents,
  friendlyDbError,
  gradeLabel,
  isIsoDate,
  parseCampDetails,
  parseSeason,
  parseSession,
  parseTiers,
} from "./camp-settings.ts";

test("dollars convert to cents without float drift", () => {
  assert.equal(dollarsToCents("19.99"), 1999);
  assert.equal(dollarsToCents("$1,250.5"), 125050);
  assert.equal(dollarsToCents("350"), 35000);
  assert.equal(dollarsToCents(0.1), 10);
  assert.equal(dollarsToCents("0"), 0);
});

test("bad money input is rejected rather than guessed", () => {
  assert.equal(dollarsToCents("-5"), null);
  assert.equal(dollarsToCents("12.345"), null);
  assert.equal(dollarsToCents("abc"), null);
  assert.equal(dollarsToCents(""), null);
  assert.equal(dollarsToCents(null), null);
});

test("cents render as an editable dollar string and round-trip", () => {
  assert.equal(centsToDollars(125050), "1250.50");
  assert.equal(centsToDollars(0), "0.00");
  assert.equal(centsToDollars(null), "0.00");
  assert.equal(dollarsToCents(centsToDollars(98765)), 98765);
});

test("camp details: blanks become null, slug is never accepted", () => {
  const result = parseCampDetails({
    name: "  Camp Hope ",
    location: "",
    director_name: "Peter",
    director_email: "Peter@CampHope.org",
    director_phone: "  ",
    logo_url: "",
    primary_color: "#1c3b2f",
    slug: "hijack",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.name, "Camp Hope");
  assert.equal(result.data.location, null);
  assert.equal(result.data.director_phone, null);
  assert.equal(result.data.director_email, "peter@camphope.org");
  assert.equal("slug" in result.data, false);
});

test("camp details: rejects bad email, colour and non-https logo", () => {
  const base = { name: "Camp Hope", director_name: "Peter", director_email: "p@x.org" };
  assert.equal(parseCampDetails({ ...base, director_email: "nope" }).ok, false);
  assert.equal(parseCampDetails({ ...base, primary_color: "green" }).ok, false);
  assert.equal(parseCampDetails({ ...base, logo_url: "http://x.org/logo.png" }).ok, false);
  assert.equal(parseCampDetails({ ...base, name: "  " }).ok, false);
});

test("dates must be real calendar days", () => {
  assert.equal(isIsoDate("2027-02-28"), true);
  assert.equal(isIsoDate("2027-02-30"), false);
  assert.equal(isIsoDate("06/01/2027"), false);
});

test("season input is validated and year coerced", () => {
  const ok = parseSeason({ year: "2027", name: "Summer 2027", forms_due_on: "2027-05-01", early_rate_ends_on: "2027-03-01" });
  assert.deepEqual(ok, {
    ok: true,
    data: { year: 2027, name: "Summer 2027", forms_due_on: "2027-05-01", early_rate_ends_on: "2027-03-01" },
  });
  assert.equal(parseSeason({ year: "27", name: "x", forms_due_on: "2027-05-01", early_rate_ends_on: "2027-03-01" }).ok, false);
});

const session = {
  name: "Week 1",
  start_date: "2027-06-14",
  end_date: "2027-06-19",
  min_grade: "0",
  max_grade: "5",
  capacity: "120",
  price: "450",
  deposit: "100.00",
};

test("session input stores dollars as cents", () => {
  const result = parseSession(session);
  assert.deepEqual(result, {
    ok: true,
    data: {
      name: "Week 1",
      start_date: "2027-06-14",
      end_date: "2027-06-19",
      min_grade: 0,
      max_grade: 5,
      capacity: 120,
      price_cents: 45000,
      deposit_cents: 10000,
    },
  });
});

test("session rules mirror the table's checks", () => {
  assert.equal(parseSession({ ...session, end_date: "2027-06-01" }).ok, false);
  assert.equal(parseSession({ ...session, min_grade: "6" }).ok, false);
  assert.equal(parseSession({ ...session, deposit: "500" }).ok, false);
  assert.equal(parseSession({ ...session, price: "-1" }).ok, false);
  assert.equal(parseSession({ ...session, capacity: "-3" }).ok, false);
});

test("tiers need exactly one row for 1-4 campers, returned in order", () => {
  const rows = [4, 2, 1, 3].map((n) => ({ camper_count: n, early: `${n * 300}`, regular: `${n * 350}.50` }));
  const result = parseTiers(rows);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.data.map((t) => t.camper_count), [1, 2, 3, 4]);
  assert.deepEqual(result.data[1], { camper_count: 2, early_cents: 60000, regular_cents: 70050 });

  assert.equal(parseTiers(rows.slice(0, 3)).ok, false);
  assert.equal(parseTiers([...rows, { camper_count: 3, early: "1", regular: "1" }]).ok, false);
  assert.equal(parseTiers(rows.map((r) => ({ ...r, early: "" }))).ok, false);
});

test("grade labels and database errors read as plain language", () => {
  assert.equal(gradeLabel(-1), "Pre-K");
  assert.equal(gradeLabel(0), "K");
  assert.equal(gradeLabel(7), "7");
  assert.equal(friendlyDbError({ code: "23505", message: "dup" }, "A season for 2027"), "A season for 2027 already exists.");
  assert.equal(friendlyDbError({ message: "boom" }), "boom");
});

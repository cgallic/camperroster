import assert from "node:assert/strict";
import test from "node:test";

import {
  applyMapping,
  chunk,
  estimateGrade,
  guessMapping,
  missingRequiredFields,
  normalizeDate,
  normalizeGender,
  normalizeGrade,
  normalizeRow,
  normalizeYesNo,
  parseCsv,
  sanitizeCell,
  validateRows,
  type RawRow,
} from "./roster-import.ts";

const TODAY = new Date(Date.UTC(2026, 9, 4));

test("CSV parser handles quotes, embedded newlines, CRLF and a BOM", () => {
  const text = '﻿First,Notes\r\n"Ada","said ""hi""\r\nthen left"\r\nBen,plain\r\n\r\n';
  assert.deepEqual(parseCsv(text), [
    ["First", "Notes"],
    ["Ada", 'said "hi"\r\nthen left'],
    ["Ben", "plain"],
  ]);
});

test("CSV parser detects tab-separated files and keeps empty trailing cells", () => {
  assert.deepEqual(parseCsv("a\tb\tc\n1\t\t3\n4\t5\t"), [
    ["a", "b", "c"],
    ["1", "", "3"],
    ["4", "5", ""],
  ]);
  assert.deepEqual(parseCsv("a,b\n1,2"), [["a", "b"], ["1", "2"]]);
});

test("formula prefixes are stripped from cell values", () => {
  assert.equal(sanitizeCell("=HYPERLINK(\"x\")"), 'HYPERLINK("x")');
  assert.equal(sanitizeCell("+1 555 0100"), "+1 555 0100");
  assert.equal(sanitizeCell("+SUM(A1)"), "SUM(A1)");
  assert.equal(sanitizeCell("@SUM(A1)"), "SUM(A1)");
  assert.equal(sanitizeCell("  -cmd"), "cmd");
  assert.equal(sanitizeCell(null), "");
  assert.equal(sanitizeCell(42), "42");
});

test("vendor headers are guessed onto fields, each field used once", () => {
  const mapping = guessMapping([
    "First Name",
    "Last Name",
    "DOB",
    "Grade",
    "Parent 1 First Name",
    "Parent 1 Last Name",
    "Parent 1 Email",
    "Parent 2 Email",
    "P1 Phone",
    "Allergies",
    "Camper's Date of Birth (MM/DD/YYYY)",
    "T-shirt size",
  ]);
  assert.deepEqual(mapping, [
    "camper_first_name",
    "camper_last_name",
    "camper_birth_date",
    "camper_grade",
    "guardian_first_name",
    "guardian_last_name",
    "guardian_email",
    null,
    "guardian_phone",
    "allergies",
    null,
    null,
  ]);
});

test("aliases from the different exports land on the same field", () => {
  assert.deepEqual(guessMapping(["Guardian Email"]), ["guardian_email"]);
  assert.deepEqual(guessMapping(["P1 Email"]), ["guardian_email"]);
  assert.deepEqual(guessMapping(["Birthdate"]), ["camper_birth_date"]);
  assert.deepEqual(guessMapping(["Camper's Date of Birth (MM/DD/YYYY)"]), ["camper_birth_date"]);
  assert.deepEqual(guessMapping(["Parent/Guardian Email Address"]), ["guardian_email"]);
  assert.deepEqual(guessMapping(["Parent First Name"]), ["guardian_first_name"]);
});

test("missing required fields are reported from the mapping", () => {
  assert.deepEqual(missingRequiredFields(["camper_first_name", null, "guardian_email"]), [
    "camper_last_name",
    "camper_birth_date",
  ]);
});

test("dates read from US, ISO and Excel serial formats", () => {
  assert.equal(normalizeDate("6/3/2014", TODAY), "2014-06-03");
  assert.equal(normalizeDate("06-03-14", TODAY), "2014-06-03");
  assert.equal(normalizeDate("2014-06-03", TODAY), "2014-06-03");
  assert.equal(normalizeDate("2014-06-03T00:00:00.000Z", TODAY), "2014-06-03");
  assert.equal(normalizeDate("41793", TODAY), "2014-06-03");
  assert.equal(normalizeDate("2/30/2014", TODAY), null);
  assert.equal(normalizeDate("next tuesday", TODAY), null);
});

test("grades, genders and yes/no normalise", () => {
  assert.equal(normalizeGrade("K"), 0);
  assert.equal(normalizeGrade("Kindergarten"), 0);
  assert.equal(normalizeGrade("Rising 5th"), 5);
  assert.equal(normalizeGrade("5th grade"), 5);
  assert.equal(normalizeGrade("Grade 7"), 7);
  assert.equal(normalizeGrade("12"), 12);
  assert.equal(normalizeGrade("13"), null);
  assert.equal(normalizeGrade("Pre-K"), null);
  assert.equal(normalizeGender("F"), "female");
  assert.equal(normalizeGender("Boy"), "male");
  assert.equal(normalizeGender("prefer not to say"), null);
  assert.equal(normalizeYesNo("Yes"), true);
  assert.equal(normalizeYesNo("n"), false);
  assert.equal(normalizeYesNo("maybe"), null);
});

test("a blank grade is estimated from the birth date with a warning", () => {
  assert.equal(estimateGrade("2016-03-01", TODAY), 6);
  const { row, warnings } = normalizeRow(
    { camper_first_name: "Ada", camper_last_name: "Lee", camper_birth_date: "3/1/2016", guardian_email: "a@b.co" },
    2,
    TODAY,
  );
  assert.equal(row?.camper_grade, 6);
  assert.ok(warnings.some((w) => w.field === "camper_grade"));
});

const good: RawRow = {
  camper_first_name: "Ada",
  camper_last_name: "Lee",
  camper_birth_date: "6/3/2014",
  camper_gender: "F",
  camper_grade: "Rising 6th",
  guardian_first_name: "Grace",
  guardian_last_name: "Lee",
  guardian_email: " Grace.Lee@Example.COM ",
  guardian_phone: "555-0100",
  guardian_relationship: "Mother",
  guardian_address_line1: "1 Main St",
  guardian_city: "Austin",
  guardian_state: "TX",
  guardian_zip: "78701",
  allergies: "Peanuts",
  medications: "None",
  has_epipen: "yes",
};

test("a complete row normalises with lowercase email and blank 'None' health text", () => {
  const { row, errors, warnings } = normalizeRow(good, 2, TODAY);
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.equal(row?.guardian_email, "grace.lee@example.com");
  assert.equal(row?.camper_birth_date, "2014-06-03");
  assert.equal(row?.camper_grade, 6);
  assert.equal(row?.camper_gender, "female");
  assert.equal(row?.allergies, "Peanuts");
  assert.equal(row?.medications, null);
  assert.equal(row?.has_epipen, true);
});

test("missing optional guardian details get defaults and warnings, not errors", () => {
  const { row, errors, warnings } = normalizeRow(
    { camper_first_name: "Ben", camper_last_name: "Ortiz", camper_birth_date: "2015-01-02", camper_grade: "4", guardian_email: "p@example.com" },
    3,
    TODAY,
  );
  assert.deepEqual(errors, []);
  assert.equal(row?.guardian_relationship, "guardian");
  assert.equal(row?.guardian_phone, "");
  assert.equal(row?.guardian_last_name, "Ortiz");
  const fields = warnings.map((w) => w.field);
  assert.ok(fields.includes("guardian_phone"));
  assert.ok(fields.includes("guardian_relationship"));
  assert.ok(fields.includes("guardian_address_line1"));
});

test("validateRows reports missing required values and in-file duplicates by spreadsheet row", () => {
  const result = validateRows(
    [
      good,
      { ...good, guardian_email: "" },
      { ...good, camper_birth_date: "not a date" },
      { ...good, camper_first_name: "ADA ", guardian_email: "other@example.com" },
      { ...good, camper_first_name: "Cy" },
    ],
    { today: TODAY },
  );
  assert.equal(result.rows.length, 2);
  assert.deepEqual(
    result.errors.map((e) => [e.row, e.field]),
    [
      [3, "guardian_email"],
      [4, "camper_birth_date"],
      [5, null],
    ],
  );
  assert.match(result.errors[2].message, /row 2/);
});

test("rows split into chunks of the API limit", () => {
  const parts = chunk(Array.from({ length: 1201 }, (_, i) => i));
  assert.deepEqual(parts.map((p) => p.length), [500, 500, 201]);
});

test("applyMapping ignores unmapped columns and sanitises values", () => {
  assert.deepEqual(
    applyMapping([["=Ada", "x", "Lee"]], ["camper_first_name", null, "camper_last_name"]),
    [{ camper_first_name: "Ada", camper_last_name: "Lee" }],
  );
});

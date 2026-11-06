import assert from "node:assert/strict";
import test from "node:test";

import {
  filterRoster,
  isExpectedVolunteer,
  outstandingDocuments,
  rosterCounts,
  volunteerKind,
  type MeetingRosterRow,
} from "./meeting-checkin.ts";

const types = [
  { id: "bg", name: "Background check", applies_to: "adult_volunteer", is_required: true },
  { id: "virtus", name: "VIRTUS", applies_to: "adult_volunteer", is_required: true },
  { id: "ref", name: "Reference", applies_to: "teen_volunteer", is_required: true },
  { id: "photo", name: "Photo release", applies_to: "adult_volunteer", is_required: false },
];

test("teen or adult is decided by age on the day, defaulting to adult", () => {
  const day = new Date("2027-06-10T00:00:00Z");
  assert.equal(volunteerKind("2009-06-11", day), "teen_volunteer");
  assert.equal(volunteerKind("2009-06-10", day), "adult_volunteer");
  assert.equal(volunteerKind(null, day), "adult_volunteer");
});

test("only approved, unexpired documents count as in", () => {
  const records = [
    { document_type_id: "bg", staff_application_id: "a", status: "approved", expires_on: "2028-01-01" },
    { document_type_id: "virtus", staff_application_id: "a", status: "submitted", expires_on: null },
  ];
  assert.deepEqual(outstandingDocuments("adult_volunteer", types, records, "2027-06-10"), ["VIRTUS (submitted)"]);
});

test("a lapsed credential and a missing one are both outstanding; optional ones never are", () => {
  const records = [{ document_type_id: "bg", staff_application_id: "a", status: "approved", expires_on: "2027-01-01" }];
  assert.deepEqual(outstandingDocuments("adult_volunteer", types, records, "2027-06-10"), [
    "Background check (expired)",
    "VIRTUS",
  ]);
});

test("teens owe only the teen list", () => {
  assert.deepEqual(outstandingDocuments("teen_volunteer", types, [], "2027-06-10"), ["Reference"]);
});

test("rejected and withdrawn applicants are not expected at the meeting", () => {
  assert.equal(isExpectedVolunteer("submitted"), true);
  assert.equal(isExpectedVolunteer(null), true);
  assert.equal(isExpectedVolunteer("Rejected"), false);
  assert.equal(isExpectedVolunteer("withdrawn"), false);
});

test("the missing-docs filter and counts read the same rows", () => {
  const row = (id: string, signed: boolean, docs: boolean): MeetingRosterRow => ({
    id,
    name: id,
    kind: "adult_volunteer",
    role: null,
    signedInAt: signed ? "2027-06-10T18:00:00Z" : null,
    docsComplete: docs,
    outstanding: docs ? [] : ["VIRTUS"],
  });
  const rows = [row("a", true, true), row("b", true, false), row("c", false, false)];
  assert.deepEqual(filterRoster(rows, "missing_docs").map((r) => r.id), ["b", "c"]);
  assert.deepEqual(filterRoster(rows, "not_signed_in").map((r) => r.id), ["c"]);
  assert.equal(filterRoster(rows, "all").length, 3);
  assert.deepEqual(rosterCounts(rows), { expected: 3, signedIn: 2, missingDocs: 2, ready: 1 });
});

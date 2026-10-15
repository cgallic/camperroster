import assert from "node:assert/strict";
import test from "node:test";

import { answerLabel, buildFamilyIntake, formSupportsFamilyIntake, parseGrade } from "./form-family-intake.ts";
import type { FormField } from "./forms.ts";

function f(field_key: string, extra: Partial<FormField> = {}): FormField {
  return {
    id: field_key,
    camp_id: "c",
    form_id: "f",
    field_key,
    label: field_key,
    help_text: null,
    field_type: "text",
    required: true,
    options: [],
    visible_when: null,
    section: null,
    display_order: 0,
    ...extra,
  };
}

const household = [
  "guardian_first_name",
  "guardian_last_name",
  "guardian_email",
  "guardian_phone",
  "address_street",
  "address_city",
  "address_state",
  "address_zip",
].map((k) => f(k));
const singleCamper = ["camper_first_name", "camper_last_name", "camper_gender", "camper_birth_date", "camper_grade"].map((k) => f(k));

test("only a form with every household question becomes a household", () => {
  assert.equal(formSupportsFamilyIntake([...household, ...singleCamper]), true);
  assert.equal(formSupportsFamilyIntake(household), false);
  assert.equal(formSupportsFamilyIntake(singleCamper), false);
});

test("a form without a repeated block registers its one camper", () => {
  const answers = {
    guardian_first_name: "A",
    guardian_last_name: "B",
    guardian_email: "a@b.org",
    guardian_phone: "9085550100",
    address_street: "1 Main",
    address_city: "Town",
    address_state: "NJ",
    address_zip: "07060",
    camper_first_name: "C",
    camper_last_name: "B",
    camper_gender: "Female",
    camper_birth_date: "2016-01-02",
    camper_grade: "4th",
  };
  const result = buildFamilyIntake([...household, ...singleCamper], answers);
  assert.ok(result.ok);
  assert.deepEqual(result.payload.campers, [{ first_name: "C", last_name: "B", gender: "female", birth_date: "2016-01-02", grade: 4 }]);

  const bad = buildFamilyIntake([...household, ...singleCamper], { ...answers, camper_grade: "NA" });
  assert.equal(bad.ok, false);
  assert.ok(!bad.ok && bad.errors.camper_grade);
});

test("grades read the leading number; anything else is not a grade", () => {
  assert.equal(parseGrade("2nd"), 2);
  assert.equal(parseGrade("9th grade (C.L.A.S. Act)"), 9);
  assert.equal(parseGrade("10"), 10);
  assert.equal(parseGrade("NA"), null);
  assert.equal(parseGrade(undefined), null);
});

test("staff see a repeated answer under its question and copy number", () => {
  const labels = new Map([["camper_gender", "Gender"]]);
  assert.equal(answerLabel(labels, "camper_gender"), "Gender");
  assert.equal(answerLabel(labels, "camper_gender__2"), "Gender (#2)");
  assert.equal(answerLabel(labels, "unknown_key"), "unknown key");
});

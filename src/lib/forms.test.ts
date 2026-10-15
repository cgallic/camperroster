import assert from "node:assert/strict";
import test from "node:test";

import {
  checkAudienceAge,
  expandRepeats,
  normalizeOptions,
  optionsToText,
  parseOptionsText,
  parseRepeatKey,
  pickKnownAnswers,
  validateSubmission,
  visibleFields,
  type FormField,
} from "./forms.ts";

let order = 0;
function field(partial: Partial<FormField> & Pick<FormField, "field_key" | "field_type">): FormField {
  order += 1;
  return {
    id: `id_${partial.field_key}`,
    camp_id: "camp",
    form_id: "form",
    label: partial.field_key,
    help_text: null,
    required: false,
    options: [],
    visible_when: null,
    section: null,
    display_order: order,
    repeat_count_field: null,
    ...partial,
  };
}

const COUNT = field({ field_key: "camper_count", field_type: "select", required: true, options: ["1", "2", "3", "4", "5"] });
const NAME = field({ field_key: "camper_first_name", field_type: "text", required: true, section: "Camper", repeat_count_field: "camper_count" });
const GRADE = field({
  field_key: "camper_grade",
  field_type: "select",
  required: true,
  section: "Camper",
  repeat_count_field: "camper_count",
  options: [{ value: "2nd", label: "2nd grade (Camper) - My child finishes 2nd grade" }, { value: "9th", label: "9th grade (C.L.A.S. Act)" }],
});
const AFTER = field({ field_key: "heard_about", field_type: "text", required: true });
const CAMPER_FORM = [COUNT, NAME, GRADE, AFTER];

test("the camper block is laid out once per camper, grouped per camper", () => {
  const laid = expandRepeats(CAMPER_FORM, { camper_count: "3" });
  assert.deepEqual(
    laid.map((f) => f.field_key),
    [
      "camper_count",
      "camper_first_name__1",
      "camper_grade__1",
      "camper_first_name__2",
      "camper_grade__2",
      "camper_first_name__3",
      "camper_grade__3",
      "heard_about",
    ]
  );
  assert.deepEqual([...new Set(laid.map((f) => f.section))], [null, "Camper 1", "Camper 2", "Camper 3"]);
  assert.equal(expandRepeats(CAMPER_FORM, {}).length, 2, "no count yet means no camper block");
  assert.deepEqual(parseRepeatKey("camper_grade__2"), { base: "camper_grade", index: 2 });
  assert.equal(parseRepeatKey("camper_grade"), null);
});

test("every requested camper copy is required, and only those copies", () => {
  const two = { camper_count: "2", heard_about: "Parish", camper_first_name__1: "Bo", camper_grade__1: "2nd" };
  const result = validateSubmission(CAMPER_FORM, two);
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.ok ? {} : result.errors).sort(), ["camper_first_name__2", "camper_grade__2"]);

  // Dropping the count to 1 leaves camper 2's blanks behind without blocking.
  assert.deepEqual(validateSubmission(CAMPER_FORM, { ...two, camper_count: "1" }), { ok: true });
});

test("a choice is stored and checked by its value, not its wording", () => {
  const base = { camper_count: "1", heard_about: "Friend", camper_first_name__1: "Bo" };
  assert.deepEqual(validateSubmission(CAMPER_FORM, { ...base, camper_grade__1: "9th" }), { ok: true });
  const byLabel = validateSubmission(CAMPER_FORM, { ...base, camper_grade__1: "9th grade (C.L.A.S. Act)" });
  assert.equal(byLabel.ok, false);
});

test("answers for camper copies the count no longer asks for are dropped", () => {
  const kept = pickKnownAnswers(CAMPER_FORM, {
    camper_count: "1",
    camper_first_name__1: "Bo",
    camper_first_name__2: "Stale",
    camper_first_name: "not a real key",
    junk: "x",
  });
  assert.deepEqual(kept, { camper_count: "1", camper_first_name__1: "Bo" });
});

test("a required question hidden behind a condition never blocks submission", () => {
  const when = field({ field_key: "when_can_you_serve", field_type: "radio", required: true, options: [{ value: "Other", label: "Other" }, { value: "Whole Week", label: "I can serve the whole week" }] });
  const dates = field({
    field_key: "exact_dates",
    field_type: "text",
    required: true,
    visible_when: { field: "when_can_you_serve", op: "eq", value: "Other" },
  });
  assert.deepEqual(validateSubmission([when, dates], { when_can_you_serve: "Whole Week" }), { ok: true });
  const other = validateSubmission([when, dates], { when_can_you_serve: "Other" });
  assert.equal(other.ok, false);
  assert.ok(!other.ok && other.errors.exact_dates);
});

test("a question watching a hidden question is hidden too", () => {
  const catholic = field({ field_key: "catholic", field_type: "radio", required: true, options: ["Yes", "No"] });
  const christian = field({
    field_key: "christian",
    field_type: "radio",
    required: true,
    options: ["Yes", "No"],
    visible_when: { field: "catholic", op: "eq", value: "No" },
  });
  const explain = field({
    field_key: "explain",
    field_type: "textarea",
    required: true,
    visible_when: { field: "christian", op: "eq", value: "No" },
  });
  const form = [catholic, christian, explain];
  // "Christian = No" is left over from before switching "Catholic" to Yes.
  const answers = { catholic: "Yes", christian: "No" };
  assert.deepEqual(visibleFields(form, answers).map((f) => f.field_key), ["catholic"]);
  assert.deepEqual(validateSubmission(form, answers), { ok: true });
  assert.equal(validateSubmission(form, { catholic: "No", christian: "No" }).ok, false);
});

test("a signature is a drawn PNG or a typed name, nothing else", () => {
  const sig = field({ field_key: "digital_signature", field_type: "signature", required: true });
  assert.deepEqual(validateSubmission([sig], { digital_signature: "data:image/png;base64,iVBORw0KGgo=" }), { ok: true });
  assert.deepEqual(validateSubmission([sig], { digital_signature: "Dana Whitfield" }), { ok: true });
  assert.equal(validateSubmission([sig], { digital_signature: "" }).ok, false);
  assert.equal(validateSubmission([sig], { digital_signature: "data:text/html;base64,PHNjcmlwdD4=" }).ok, false);
});

test("options round-trip through the editor's text form and the jsonb column", () => {
  const options = [
    "Yes",
    { value: "Yes, I consent", label: "I consent to photographs, video or other media" },
  ];
  const text = optionsToText(options);
  assert.equal(text, "Yes\nYes, I consent | I consent to photographs, video or other media");
  assert.deepEqual(parseOptionsText(text), options);
  assert.deepEqual(normalizeOptions([1, "a", { value: "b", label: "b" }, { label: "no value" }, null]), ["1", "a", "b"]);
});

test("volunteer age is measured on the first day of camp, not the day registration opens", () => {
  // Turns 18 in May: still 17 when registration opens in February.
  const dob = "2008-05-20";
  assert.equal(checkAudienceAge("new_adult", dob, "2026-02-01T00:00:00Z").ok, false);
  // By the first day of camp in June they are an adult volunteer.
  assert.deepEqual(checkAudienceAge("new_adult", dob, "2026-06-14"), { ok: true });
  const teen = checkAudienceAge("teen_volunteer", dob, "2026-06-14");
  assert.equal(teen.ok, false);
  assert.equal(!teen.ok && teen.suggestedAudience, "new_adult");
});

import assert from "node:assert/strict";
import test from "node:test";

import { convertElexioForm, htmlToText, perCamperTiers, type ElexioField, type ElexioForm } from "./elexio-convert.ts";

const COUNT_ID = "count-1";
const anyCount = ["1", "2", "3"].map((v) => ({ comparisonType: 3, dependentFieldId: COUNT_ID, matchingValue: v }));

function form(fields: ElexioField[], extra: Partial<ElexioForm> = {}): ElexioForm {
  return { id: "form-1", name: "Camp 2026 - Families", fields, ...extra };
}

test("names and addresses split into the parts the roster stores", () => {
  const out = convertElexioForm(
    form([
      { id: "n", name: "Parent/Guardian Name", type: "person-name", required: true },
      { id: "a", name: "Address", type: "address", required: true },
    ]),
    { audience: "new_family", keyOverrides: { n: { first: "guardian_first_name", last: "guardian_last_name" } } }
  );
  assert.deepEqual(
    out.fields.map((f) => [f.field_key, f.label, f.required]),
    [
      ["guardian_first_name", "Parent/Guardian Name (First)", true],
      ["guardian_last_name", "Parent/Guardian Name (Last)", true],
      ["address_street", "Address (Street)", true],
      ["address_city", "Address (City)", true],
      ["address_state", "Address (State)", true],
      ["address_zip", "Address (ZIP)", true],
    ]
  );
});

test("option keys become stored values and the wording stays the label", () => {
  const out = convertElexioForm(
    form([
      {
        id: "p",
        name: "Photo Release Consent",
        type: "radio",
        required: true,
        useOptionKeys: true,
        options: [
          { itemKey: "Yes, I consent", itemValue: "I consent to photographs" },
          { itemKey: "Same", itemValue: "Same" },
        ],
      },
      { id: "g", name: "Gender", type: "dropdown", options: [{ itemKey: "M", itemValue: "Male" }] },
    ]),
    { audience: "new_family" }
  );
  assert.deepEqual(out.fields[0].options, [{ value: "Yes, I consent", label: "I consent to photographs" }, "Same"]);
  assert.equal(out.fields[0].field_type, "radio");
  // Keys only count when Elexio says to use them.
  assert.deepEqual(out.fields[1].options, ["Male"]);
});

test("a person block tied to a count repeats off that count; one-off blocks get a heading", () => {
  const out = convertElexioForm(
    form([
      { id: COUNT_ID, name: "Number of Campers", type: "dropdown", required: true, options: [{ itemValue: "1" }, { itemValue: "2" }, { itemValue: "3" }] },
      {
        id: "camper",
        name: "Camper",
        type: "person-fieldset",
        totalAllowed: 3,
        isConditional: true,
        conditions: anyCount,
        isPaymentField: true,
        amount: 625,
        timedAmounts: [{ amount: 595, endDate: "2026-04-16T00:00:00-04:00" }],
        fields: [
          { id: "cn", name: "Person's Name", type: "person-fieldset-person-name", required: true },
          { id: "dob", name: "Date of Birth", type: "text", templateName: "date", required: true },
        ],
      },
      { id: "s", name: "", type: "static", content: "<p>Check ages</p>", isConditional: true, conditions: anyCount },
      { id: "d", name: "", type: "divider" },
      { id: "sec", name: "", type: "section", content: "Emergency Contacts" },
      {
        id: "ec",
        name: "Primary Emergency Contact",
        type: "person-fieldset",
        totalAllowed: 1,
        fields: [{ id: "ecp", name: "Emergency Contact Phone Number", type: "tel", required: true }],
      },
    ], { paymentConfiguration: { acceptsPayLater: true } }),
    { audience: "new_family" }
  );
  const rows = out.fields.map((f) => [f.field_key, f.field_type, f.section, f.repeat_count_field]);
  assert.deepEqual(rows, [
    ["number_of_campers", "select", null, null],
    ["person_s_name_first", "text", "Camper", "number_of_campers"],
    ["person_s_name_last", "text", "Camper", "number_of_campers"],
    ["date_of_birth", "date", "Camper", "number_of_campers"],
    ["text_1", "section_heading", null, null],
    ["primary_emergency_contact_heading", "section_heading", "Emergency Contacts", null],
    ["emergency_contact_phone_number", "phone", "Emergency Contacts", null],
  ]);
  assert.equal(out.fields[1].label, "Person's Name (First)");
  assert.deepEqual(out.fields[4].visible_when, { field: "number_of_campers", op: "in", value: ["1", "2", "3"] });
  assert.deepEqual(out.pricing, {
    amount_cents: 62500,
    early_amount_cents: 59500,
    early_ends_on: "2026-04-16",
    max_campers: 3,
    accepts_pay_later: true,
  });
  assert.deepEqual(perCamperTiers(out.pricing!).map((t) => [t.camper_count, t.early_cents, t.regular_cents]), [
    [1, 59500, 62500],
    [2, 119000, 125000],
    [3, 178500, 187500],
  ]);
});

test("a single equals condition stays a plain equals; omitted blocks are recorded", () => {
  const out = convertElexioForm(
    form([
      { id: "w", name: "When can you serve?", type: "radio", useOptionKeys: true, options: [{ itemKey: "Other", itemValue: "Other" }] },
      {
        id: "x",
        name: "Please enter exactly which dates you are available",
        type: "text",
        required: true,
        isConditional: true,
        conditions: [{ comparisonType: 3, dependentFieldId: "w", matchingValue: "Other" }],
      },
      { id: "code", name: "", type: "static", content: "<h2>Enter the code</h2>" },
    ]),
    { audience: "new_adult", omit: { code: "no codes here" } }
  );
  assert.deepEqual(out.fields[1].visible_when, { field: "when_can_you_serve", op: "eq", value: "Other" });
  assert.deepEqual(out.omitted, [{ elexio_id: "code", reason: "no codes here", text: "Enter the code" }]);
  assert.equal(out.fields.length, 2);
});

test("anything the model cannot express fails loudly instead of converting wrongly", () => {
  assert.throws(() => convertElexioForm(form([{ id: "z", name: "Pay", type: "payment-list" }]), { audience: "new_family" }), /no mapping/);
  assert.throws(
    () =>
      convertElexioForm(
        form([
          { id: "a", name: "A", type: "text" },
          { id: "b", name: "B", type: "text", isConditional: true, conditions: [{ comparisonType: 5, dependentFieldId: "a", matchingValue: "x" }] },
        ]),
        { audience: "new_family" }
      ),
    /comparison 5/
  );
});

test("Elexio HTML copy becomes readable text with its links kept", () => {
  assert.equal(
    htmlToText(
      '<p>Thank you.</p><p>Upload by July 1st <a href="https://form.jotform.com/1">HERE</a>.&nbsp;Email <a href="mailto:a@b.org">a@b.org</a></p><ul><li><p>One</p></li><li><p>Two &amp; three</p></li></ul>'
    ),
    "Thank you.\n\nUpload by July 1st HERE (https://form.jotform.com/1). Email a@b.org\n\n• One\n\n• Two & three"
  );
  assert.equal(htmlToText(null), "");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildConfirmationMessages, submitterEmail } from "./form-confirmation.ts";

const fields = [
  { field_key: "second_parent_guardian_email", field_type: "email" as const, display_order: 20 },
  { field_key: "guardian_email", field_type: "email" as const, display_order: 5 },
  { field_key: "guardian_name", field_type: "text" as const, display_order: 1 },
];

test("the receipt goes to the first email the form asks for", () => {
  const answers = { guardian_email: " parent@example.com ", second_parent_guardian_email: "other@example.com" };
  assert.equal(submitterEmail({ fields, answers }), "parent@example.com");
});

test("a submission queues a receipt for the family and an alert for the director", () => {
  const messages = buildConfirmationMessages({
    campName: "Camp Hope",
    directorEmail: "director@example.com",
    formTitle: "New Families",
    fields,
    answers: { guardian_email: "parent@example.com" },
  });
  assert.equal(messages.length, 2);
  assert.deepEqual(messages[0].recipients.map((r) => r.email), ["parent@example.com"]);
  assert.match(messages[0].body, /Camp Hope received your "New Families" form/);
  assert.deepEqual(messages[1].recipients.map((r) => r.email), ["director@example.com"]);
  assert.match(messages[1].body, /parent@example.com/);
});

test("no valid email and no director address means nothing is queued", () => {
  const messages = buildConfirmationMessages({
    campName: "Camp Hope",
    directorEmail: null,
    formTitle: "New Families",
    fields,
    answers: { guardian_email: "not-an-email" },
  });
  assert.deepEqual(messages, []);
});

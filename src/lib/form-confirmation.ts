import { isValidEmail } from "./formContracts.ts";
import type { FormAnswers, FormField } from "./forms.ts";
import type { Recipient } from "./email.ts";

/**
 * What goes out after a public form is submitted: a receipt to the person who
 * filled it in, and an alert to the camp's director address so a submission
 * is never sitting unseen in a table.
 *
 * Both are queued as already-approved outgoing_messages, so they leave through
 * the same dispatch cron and SMTP path as every other camp email and show up
 * in the mail history. Nothing here talks to SMTP directly.
 */

export type ConfirmationInput = {
  campName: string;
  directorEmail: string | null;
  formTitle: string;
  fields: Pick<FormField, "field_key" | "field_type" | "display_order">[];
  answers: FormAnswers;
};

export type QueuedMessage = {
  subject: string;
  body: string;
  audience_label: string;
  recipients: Recipient[];
};

/** The first email answer on the form, in the order the form asks for it. */
export function submitterEmail(input: Pick<ConfirmationInput, "fields" | "answers">): string | null {
  const ordered = [...input.fields].sort((a, b) => a.display_order - b.display_order);
  for (const field of ordered) {
    if (field.field_type !== "email") continue;
    const value = input.answers[field.field_key];
    if (typeof value === "string" && isValidEmail(value.trim())) return value.trim();
  }
  return null;
}

export function buildConfirmationMessages(input: ConfirmationInput): QueuedMessage[] {
  const messages: QueuedMessage[] = [];
  const email = submitterEmail(input);

  if (email) {
    messages.push({
      subject: `${input.campName}: we received your form`,
      body: [
        "Hello,",
        "",
        `Thank you. ${input.campName} received your "${input.formTitle}" form.`,
        "",
        "A member of the camp team will review it and contact you about next steps. You don't need to submit it again.",
        "",
        `— ${input.campName}`,
      ].join("\n"),
      audience_label: "Form confirmation",
      recipients: [{ email, context: input.formTitle }],
    });
  }

  const office = input.directorEmail?.trim();
  if (office && isValidEmail(office)) {
    messages.push({
      subject: `New submission: ${input.formTitle}`,
      body: [
        `A new "${input.formTitle}" form was submitted${email ? ` by ${email}` : ""}.`,
        "",
        "Open the director portal to review it.",
      ].join("\n"),
      audience_label: "New form submission",
      recipients: [{ email: office, context: "Camp director address" }],
    });
  }

  return messages;
}

/**
 * Queues the messages for the next dispatch run. A failure here is logged and
 * swallowed: the submission is already saved, and the family must not be told
 * it failed because an email could not be queued.
 */
export async function queueConfirmationMessages(
  db: any,
  campId: string,
  formId: string,
  fields: ConfirmationInput["fields"],
  answers: FormAnswers
): Promise<void> {
  try {
    const [{ data: camp }, { data: form }] = await Promise.all([
      db.from("camps").select("name, director_email").eq("id", campId).maybeSingle(),
      db.from("form_definitions").select("title").eq("id", formId).maybeSingle(),
    ]);
    if (!camp) return;

    const messages = buildConfirmationMessages({
      campName: camp.name,
      directorEmail: camp.director_email ?? null,
      formTitle: form?.title ?? "registration",
      fields,
      answers,
    });
    if (messages.length === 0) return;

    const now = new Date().toISOString();
    const { error } = await db.from("outgoing_messages").insert(
      messages.map((m) => ({
        camp_id: campId,
        subject: m.subject,
        body: m.body,
        audience_label: m.audience_label,
        recipients: m.recipients,
        source_view: "form_submission",
        scheduled_for: now,
        status: "approved",
        approved_at: now,
      }))
    );
    if (error) console.error("Could not queue form confirmation:", error.message);
  } catch (err) {
    console.error("Could not queue form confirmation:", err);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Outgoing mail.
 *
 * The camp's rule is that nothing goes out unread. A predrafted message lands
 * with the communicator the day before it is due, carrying its subject, the
 * population and addresses it goes to, the body as it will read, and a link
 * back to the data it was drawn from. Only after a human approves it does it
 * send, at the time that was agreed.
 *
 * That rule is enforced here rather than by convention: `sendMessage` refuses
 * any row whose status is not 'approved', and there is no other function in
 * this file that hands anything to nodemailer. Composition and sending are
 * deliberately separate, so rendering a page can never post a letter.
 */

import { createHash, timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { PROVISIONAL_HOLD_MESSAGE } from "./registration-status";

export type Recipient = {
  email: string;
  name?: string | null;
  /** Free-form; used on the review screen to explain why someone is on the list. */
  context?: string | null;
};

export type MessageStatus =
  | "draft"
  | "awaiting_review"
  | "approved"
  | "sent"
  | "cancelled"
  | "failed";

export type MergeValues = Record<string, string | number | null | undefined>;

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

/**
 * Fills `{{placeholders}}`. An unknown key is left visibly intact rather than
 * blanked, so a reviewer sees "{{camper_name}}" and catches the mistake instead
 * of approving a letter addressed to nobody.
 */
export function renderTemplate(text: string, values: MergeValues): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (whole, key: string) => {
    const value = values[key];
    if (value === undefined || value === null || value === "") return whole;
    return String(value);
  });
}

/** Placeholders a body still carries after merging — the reviewer's warning list. */
export function unresolvedKeys(text: string): string[] {
  return [...new Set([...text.matchAll(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g)].map((m) => m[1]))];
}

export type EmailTemplate = {
  id?: string;
  code: string;
  name: string;
  subject: string;
  body: string;
  merge_keys: string[];
};

export type ComposedMessage = {
  subject: string;
  body: string;
  unresolved: string[];
};

export function composeMessage(template: Pick<EmailTemplate, "subject" | "body">, values: MergeValues): ComposedMessage {
  const subject = renderTemplate(template.subject, values);
  const body = renderTemplate(template.body, values);
  return { subject, body, unresolved: [...new Set([...unresolvedKeys(subject), ...unresolvedKeys(body)])] };
}

/** A plain-text body rendered as simple HTML, preserving the writer's paragraphs. */
export function bodyToHtml(body: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 1em 0;line-height:1.55">${p.replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Standard templates
// ---------------------------------------------------------------------------

/**
 * The letters the camp already sends, written out so a new season starts with
 * them in place. `seedTemplates` inserts any that are missing and never
 * overwrites wording the camp has since edited.
 */
export const STANDARD_TEMPLATES: EmailTemplate[] = [
  {
    code: "waitlist_notice",
    name: "Waitlist notice",
    subject: "{{camper_name}} is on the waiting list for {{camp_name}}",
    merge_keys: ["camper_name", "camp_name", "waitlist_position", "grade", "contact_email"],
    body: `Dear {{guardian_name}},

Thank you for registering {{camper_name}} for {{camp_name}}. The cabins for grade {{grade}} are full, so {{camper_name}} has been placed on our waiting list at position {{waitlist_position}}.

Places open up most years as plans change, and we work down the list in the order registrations arrived. We will write to you the moment a spot opens. Nothing further is needed from you now, and you have not been charged.

If your plans change in the meantime, please let us know at {{contact_email}} so we can offer the place to the next family.

Warmly,
{{camp_name}}`,
  },
  {
    code: "spot_opened",
    name: "A spot has opened",
    subject: "A spot has opened for {{camper_name}} at {{camp_name}}",
    merge_keys: ["camper_name", "guardian_name", "camp_name", "respond_by", "portal_url", "contact_email"],
    body: `Dear {{guardian_name}},

Good news — a place has opened in {{camper_name}}'s cabin group at {{camp_name}}, and it is yours if you would still like it.

Please confirm by {{respond_by}} at {{portal_url}}. After that date we will offer the place to the next family on the list.

${PROVISIONAL_HOLD_MESSAGE}

If you have any questions, write to us at {{contact_email}}.

Warmly,
{{camp_name}}`,
  },
  {
    code: "paperwork_reminder",
    name: "Paperwork reminder",
    subject: "Paperwork still outstanding for {{camper_name}}",
    merge_keys: ["camper_name", "guardian_name", "missing_items", "forms_due_on", "portal_url", "camp_name"],
    body: `Dear {{guardian_name}},

We are still waiting on some paperwork for {{camper_name}}:

{{missing_items}}

Everything is due by {{forms_due_on}} and can be uploaded at {{portal_url}}.

${PROVISIONAL_HOLD_MESSAGE}

Thank you,
{{camp_name}}`,
  },
  {
    code: "registration_complete",
    name: "Registration complete",
    subject: "{{camper_name}} is fully registered for {{camp_name}}",
    merge_keys: ["camper_name", "guardian_name", "camp_name", "cabin_name", "arrival_details", "portal_url"],
    body: `Dear {{guardian_name}},

{{camper_name}} is fully registered for {{camp_name}}. Every form has been received and approved, and the balance is paid in full. Nothing further is needed from you.

Cabin: {{cabin_name}}

{{arrival_details}}

You can review everything on file at any time at {{portal_url}}.

We are looking forward to seeing you,
{{camp_name}}`,
  },
  {
    code: "registration_partial",
    name: "Registration partially complete",
    subject: "{{camper_name}}'s registration is not yet complete",
    merge_keys: ["camper_name", "guardian_name", "missing_items", "forms_due_on", "portal_url", "camp_name"],
    body: `Dear {{guardian_name}},

Thank you for starting {{camper_name}}'s registration for {{camp_name}}.

${PROVISIONAL_HOLD_MESSAGE}

Still outstanding:

{{missing_items}}

Please complete these by {{forms_due_on}} at {{portal_url}}.

Thank you,
{{camp_name}}`,
  },
  {
    code: "teen_application_received",
    name: "Teen application received",
    subject: "We have your counselor application, {{applicant_name}}",
    merge_keys: ["applicant_name", "camp_name", "reference_name", "contact_email"],
    body: `Dear {{applicant_name}},

Thank you for applying to serve as a teen counselor at {{camp_name}}. Your application has been received.

Two things happen next. We need a reference for you — we will be contacting {{reference_name}} directly, so there is nothing for you to chase. Once that reference is back, the leadership team reviews your application and makes a decision. A decision is still pending until then, and we will write to you either way.

If anything about your application changes, write to us at {{contact_email}}.

Thank you for offering to serve,
{{camp_name}}`,
  },
  {
    code: "adult_application_received",
    name: "Adult application received",
    subject: "We have your volunteer application, {{applicant_name}}",
    merge_keys: ["applicant_name", "camp_name", "missing_items", "contact_email"],
    body: `Dear {{applicant_name}},

Thank you for applying to volunteer at {{camp_name}}. Your application has been received, and a decision is pending while the leadership team reviews it.

Outstanding items on your file:

{{missing_items}}

We will write to you as soon as a decision has been made. Any questions in the meantime can go to {{contact_email}}.

Thank you for offering to serve,
{{camp_name}}`,
  },
  {
    code: "volunteer_approved",
    name: "Volunteer approved with next steps",
    subject: "You are approved to serve at {{camp_name}}",
    merge_keys: ["applicant_name", "camp_name", "service_area", "serving_dates", "next_steps", "contact_email"],
    body: `Dear {{applicant_name}},

You have been approved to serve at {{camp_name}}. Thank you — we are glad to have you.

Area of service: {{service_area}}
Dates you are serving: {{serving_dates}}

Next steps:

{{next_steps}}

If any of the above is wrong, or your availability has changed, please write to {{contact_email}} as soon as you can.

See you at camp,
{{camp_name}}`,
  },
  {
    code: "payment_reminder",
    name: "Payment reminder",
    subject: "A payment for {{camp_name}} is due on {{due_on}}",
    merge_keys: ["household_name", "camp_name", "due_on", "amount_due", "balance", "portal_url"],
    body: `Dear {{household_name}},

This is a friendly reminder that a payment of {{amount_due}} for {{camp_name}} is due on {{due_on}}. Your remaining balance after that payment will be {{balance}}.

You can pay at {{portal_url}}.

If the timing is difficult this year, please tell us — we would far rather arrange something than have a family stay away.

Thank you,
{{camp_name}}`,
  },
  {
    code: "payment_late",
    name: "Payment late",
    subject: "A payment for {{camp_name}} is past due",
    merge_keys: ["household_name", "camp_name", "due_on", "amount_due", "balance", "portal_url", "contact_email"],
    body: `Dear {{household_name}},

Our records show a payment of {{amount_due}} for {{camp_name}}, due on {{due_on}}, has not yet reached us. Your outstanding balance is {{balance}}.

If you have paid in the last few days, thank you — please ignore this note.

Otherwise you can pay at {{portal_url}}. If money is the obstacle, write to {{contact_email}} and ask about financial aid. No child misses camp over a balance.

Thank you,
{{camp_name}}`,
  },
];

/** Inserts any standard template this camp does not already have. */
export async function seedTemplates(db: any, campId: string): Promise<{ inserted: string[] }> {
  const { data: existing } = await db.from("email_templates").select("code").eq("camp_id", campId);
  const have = new Set(((existing ?? []) as { code: string }[]).map((r) => r.code));
  const missing = STANDARD_TEMPLATES.filter((t) => !have.has(t.code));
  if (missing.length === 0) return { inserted: [] };

  const { error } = await db.from("email_templates").insert(
    missing.map((t) => ({
      camp_id: campId,
      code: t.code,
      name: t.name,
      subject: t.subject,
      body: t.body,
      merge_keys: t.merge_keys,
    }))
  );
  if (error) throw new Error(error.message);
  return { inserted: missing.map((t) => t.code) };
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
};

export function smtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM;
  if (!host || !user || !pass || !from) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  return { host, port, user, pass, from, secure: port === 465 };
}

let cachedTransport: Transporter | null = null;

function transport(config: SmtpConfig): Transporter {
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });
  }
  return cachedTransport;
}

export type OutgoingMessageRow = {
  id: string;
  camp_id: string;
  subject: string;
  body: string;
  audience_label: string;
  recipients: Recipient[];
  source_view: string | null;
  scheduled_for: string | null;
  status: MessageStatus;
};

export type SendOutcome =
  | { ok: true; id: string; accepted: number }
  | { ok: false; id: string; reason: string };

/**
 * Sends one queued message. This is the only path to the SMTP server in the
 * codebase, and it opens with the approval check, so an unapproved row cannot
 * be posted by any caller — including a future one that forgot the rule.
 *
 * Recipients go in BCC: the camp mails whole populations, and a parent should
 * not receive every other parent's address.
 */
export async function sendMessage(db: any, message: OutgoingMessageRow): Promise<SendOutcome> {
  if (message.status !== "approved") {
    return { ok: false, id: message.id, reason: `Refusing to send a message in status "${message.status}"` };
  }

  const recipients = (message.recipients ?? []).map((r) => r.email).filter(Boolean);
  if (recipients.length === 0) {
    await markFailed(db, message.id, "No recipients on the message");
    return { ok: false, id: message.id, reason: "No recipients on the message" };
  }

  const config = smtpConfig();
  if (!config) {
    const reason = "SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM)";
    await markFailed(db, message.id, reason);
    return { ok: false, id: message.id, reason };
  }

  try {
    const info = await transport(config).sendMail({
      from: config.from,
      to: config.from,
      bcc: recipients,
      subject: message.subject,
      text: message.body,
      html: bodyToHtml(message.body),
    });

    await db
      .from("outgoing_messages")
      .update({ status: "sent", sent_at: new Date().toISOString(), failure_reason: null })
      .eq("id", message.id);

    return { ok: true, id: message.id, accepted: info.accepted?.length ?? recipients.length };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Send failed";
    await markFailed(db, message.id, reason);
    return { ok: false, id: message.id, reason };
  }
}

async function markFailed(db: any, id: string, reason: string) {
  await db.from("outgoing_messages").update({ status: "failed", failure_reason: reason }).eq("id", id);
}

/**
 * Everything approved whose send time has passed. Ordered oldest first so a
 * backlog goes out in the order it was approved.
 */
export async function dueMessages(db: any, now = new Date()): Promise<OutgoingMessageRow[]> {
  const { data } = await db
    .from("outgoing_messages")
    .select("id, camp_id, subject, body, audience_label, recipients, source_view, scheduled_for, status")
    .eq("status", "approved")
    .lte("scheduled_for", now.toISOString())
    .order("scheduled_for", { ascending: true });
  return (data ?? []) as OutgoingMessageRow[];
}

/**
 * Constant-time secret comparison for the cron endpoint. `===` on strings
 * short-circuits at the first differing byte, which leaks the secret a
 * character at a time to anyone patient enough to time the responses.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = Buffer.from(a ?? "", "utf8");
  const bBytes = Buffer.from(b ?? "", "utf8");
  // Compare a fixed-length digest so differing lengths do not short-circuit.
  const aHash = createHash("sha256").update(aBytes).digest();
  const bHash = createHash("sha256").update(bBytes).digest();
  return nodeTimingSafeEqual(aHash, bHash) && aBytes.length === bBytes.length;
}

/** The camp schedules a day ahead: default a new draft to 9am tomorrow. */
export function defaultScheduleTime(now = new Date()): Date {
  const when = new Date(now);
  when.setDate(when.getDate() + 1);
  when.setHours(9, 0, 0, 0);
  return when;
}

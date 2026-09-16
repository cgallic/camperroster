/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, fromZod, requireMailAdmin } from "../_guard";
import { composeMessage, defaultScheduleTime, type Recipient } from "@/lib/email";
import { applyFilters, loadExportData, parseFilters, type PersonRow } from "@/lib/exports";
import { WHO_LABELS } from "@/lib/registration-status";

export const dynamic = "force-dynamic";

/**
 * Turns a filter into a real list of addresses: "all 9th grade parents", "all
 * families missing insurance", "all kitchen volunteers". The list is resolved
 * once, here, and stored on the draft, so the reviewer approves the recipients
 * they actually saw rather than a query that might return something different
 * an hour later.
 */
async function resolve(db: any, params: URLSearchParams) {
  const filters = parseFilters(params);
  const data = await loadExportData(db);
  let people = applyFilters(data.people, filters);

  // Two filters that only make sense for mail, so they live here rather than
  // in the export filter set.
  const missingDocument = params.get("missingDocument");
  if (missingDocument) {
    const needle = missingDocument.toLowerCase();
    people = people.filter((p) =>
      p.outstandingDocuments.some(
        (d) => (d.code ?? "").toLowerCase().includes(needle) || d.name.toLowerCase().includes(needle)
      )
    );
  }
  if (params.get("unpaidOnly")) people = people.filter((p) => p.balanceCents > 0);

  const recipients: Recipient[] = [];
  const seen = new Set<string>();
  for (const p of people) {
    // A camper's mail goes to the guardian; a volunteer's goes to them.
    const address = p.population === "camper" ? p.guardianEmail ?? p.email : p.email;
    if (!address) continue;
    const key = address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push({
      email: address,
      name: p.population === "camper" ? p.guardianName || p.householdName : p.fullName,
      context: contextFor(p),
    });
  }

  return { filters, people, recipients, audienceLabel: describe(params, people.length) };
}

function contextFor(p: PersonRow): string {
  const parts = [p.fullName, WHO_LABELS[p.who], p.statusLabel];
  if (p.grade !== null) parts.push(`grade ${p.grade}`);
  if (p.cabinName) parts.push(p.cabinName);
  return parts.filter(Boolean).join(" · ");
}

/** A label a human can read on the queue, built from the filter that made it. */
function describe(params: URLSearchParams, count: number): string {
  const bits: string[] = [];
  const say = (key: string, prefix = "") => {
    const values = params.getAll(key).flatMap((v) => v.split(",")).filter(Boolean);
    if (values.length) bits.push(`${prefix}${values.join(", ").replace(/_/g, " ")}`);
  };
  say("who");
  say("population");
  say("status");
  say("grade", "grade ");
  say("gender");
  say("serviceArea", "service area ");
  say("timing");
  if (params.get("missingDocument")) bits.push(`missing ${params.get("missingDocument")}`);
  if (params.get("unpaidOnly")) bits.push("with a balance");

  const what = bits.length ? bits.join(", ") : "everyone on file";
  return `${what} (${count} recipient${count === 1 ? "" : "s"})`;
}

export async function GET(req: Request) {
  const guard = await requireMailAdmin();
  if (!guard.ok) return guard.response;

  const params = new URL(req.url).searchParams;
  const { recipients, audienceLabel, people } = await resolve(guard.supabase as never, params);

  return NextResponse.json({
    audienceLabel,
    matched: people.length,
    recipients,
    sourceView: `/admin/exports?${params.toString()}`,
  });
}

const DraftSchema = z.object({
  /** The filter query string this list came from, e.g. "grade=9&population=camper". */
  query: z.string().default(""),
  templateId: z.string().uuid().nullish(),
  templateCode: z.string().nullish(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  audienceLabel: z.string().min(1).optional(),
  scheduledFor: z.string().datetime().nullish(),
  mergeValues: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

/** Resolves the filter and drops the result into the review queue as a draft. */
export async function POST(req: Request) {
  const guard = await requireMailAdmin();
  if (!guard.ok) return guard.response;

  const parsed = DraftSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);
  const input = parsed.data;

  const params = new URLSearchParams(input.query);
  const { recipients, audienceLabel } = await resolve(guard.supabase as never, params);
  if (recipients.length === 0) return badRequest("That filter matches nobody with an email address");

  let subject = input.subject ?? "";
  let body = input.body ?? "";
  let templateId = input.templateId ?? null;

  if (!subject || !body) {
    const lookup = guard.supabase.from("email_templates").select("id, subject, body");
    const { data: template } = templateId
      ? await lookup.eq("id", templateId).maybeSingle()
      : await lookup.eq("code", input.templateCode ?? "").maybeSingle();
    if (!template) return badRequest("Give a subject and body, or pick a template");
    templateId = template.id;
    const composed = composeMessage(template, input.mergeValues ?? {});
    subject = subject || composed.subject;
    body = body || composed.body;
  }

  const { data, error } = await guard.supabase
    .from("outgoing_messages")
    .insert({
      camp_id: guard.membership.campId,
      template_id: templateId,
      subject,
      body,
      audience_label: input.audienceLabel ?? audienceLabel,
      recipients,
      // The link the reviewer follows to check the list against the data.
      source_view: `/admin/exports?${params.toString()}`,
      scheduled_for: input.scheduledFor ?? defaultScheduleTime().toISOString(),
      status: "awaiting_review",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: data }, { status: 201 });
}

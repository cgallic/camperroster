import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, fromZod, requireMailAdmin } from "./_guard";
import { composeMessage, defaultScheduleTime } from "@/lib/email";

export const dynamic = "force-dynamic";

const RecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().nullish(),
  context: z.string().nullish(),
});

const CreateSchema = z.object({
  templateId: z.string().uuid().nullish(),
  templateCode: z.string().nullish(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  audienceLabel: z.string().min(1),
  recipients: z.array(RecipientSchema).min(1),
  sourceView: z.string().nullish(),
  scheduledFor: z.string().datetime().nullish(),
  mergeValues: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

/** The queue, newest first. `?status=` narrows it. */
export async function GET(req: Request) {
  const guard = await requireMailAdmin();
  if (!guard.ok) return guard.response;

  const statuses = new URL(req.url).searchParams.getAll("status").flatMap((s) => s.split(","));

  let query = guard.supabase
    .from("outgoing_messages")
    .select("*")
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (statuses.length) query = query.in("status", statuses);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ messages: data ?? [] });
}

/**
 * Builds a draft and puts it in front of the communicator. A draft created here
 * always lands in 'awaiting_review' — there is no parameter that would let a
 * caller queue something pre-approved.
 */
export async function POST(req: Request) {
  const guard = await requireMailAdmin();
  if (!guard.ok) return guard.response;

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);
  const input = parsed.data;

  let subject = input.subject ?? "";
  let body = input.body ?? "";
  let templateId = input.templateId ?? null;

  if (!subject || !body) {
    const lookup = guard.supabase.from("email_templates").select("id, subject, body");
    const { data: template } = templateId
      ? await lookup.eq("id", templateId).maybeSingle()
      : await lookup.eq("code", input.templateCode ?? "").maybeSingle();

    if (!template) return badRequest("Give a subject and body, or a template that exists");
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
      audience_label: input.audienceLabel,
      recipients: input.recipients,
      source_view: input.sourceView ?? null,
      // The camp's habit is a day's notice, so that is the default.
      scheduled_for: input.scheduledFor ?? defaultScheduleTime().toISOString(),
      status: "awaiting_review",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: data }, { status: 201 });
}

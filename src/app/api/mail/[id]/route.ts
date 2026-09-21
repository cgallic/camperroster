import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, fromZod, requireMailAdmin } from "../_guard";
import type { Database } from "@/lib/supabase/database.types";
import { smtpConfig } from "@/lib/email";

type MessagePatch = Database["public"]["Tables"]["outgoing_messages"]["Update"];

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  audienceLabel: z.string().min(1).optional(),
  scheduledFor: z.string().datetime().nullish(),
  /**
   * `approve` is the one that matters: it is the human step the whole queue
   * exists for, and it stamps who did it and when.
   */
  action: z.enum(["save", "approve", "schedule", "approve_and_schedule", "cancel", "unapprove"]).optional(),
});

/** Edit the body, approve it, set a send time, or call it off. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireMailAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);
  const input = parsed.data;

  const { data: existing, error: readError } = await guard.supabase
    .from("outgoing_messages")
    .select("id, status, scheduled_for")
    .eq("id", id)
    .maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 400 });
  if (!existing) return NextResponse.json({ error: "No such message" }, { status: 404 });
  if (existing.status === "sent") return badRequest("That message has already gone out");

  // Typed against the generated row, so a misspelled column fails the build
  // rather than silently doing nothing at runtime.
  const patch: MessagePatch = {};
  if (input.subject !== undefined) patch.subject = input.subject;
  if (input.body !== undefined) patch.body = input.body;
  if (input.audienceLabel !== undefined) patch.audience_label = input.audienceLabel;
  if (input.scheduledFor !== undefined) patch.scheduled_for = input.scheduledFor;

  const action = input.action ?? "save";

  if (action === "approve" || action === "approve_and_schedule") {
    if (!smtpConfig()) {
      return NextResponse.json(
        { error: "Email delivery is not configured. The draft was not approved or scheduled." },
        { status: 503 }
      );
    }
    const when = input.scheduledFor ?? existing.scheduled_for;
    if (!when) return badRequest("Approving needs a send time — schedule it first");
    patch.scheduled_for = when;
    patch.status = "approved";
    patch.approved_by = guard.userId;
    patch.approved_at = new Date().toISOString();
    patch.failure_reason = null;
  } else if (action === "cancel") {
    patch.status = "cancelled";
  } else if (action === "unapprove") {
    // Pulls a message back out of the send queue without losing the draft.
    patch.status = "awaiting_review";
    patch.approved_by = null;
    patch.approved_at = null;
  } else if (existing.status === "approved") {
    // Any edit invalidates the approval: the reviewer approved the words they
    // read, not whatever replaced them.
    patch.status = "awaiting_review";
    patch.approved_by = null;
    patch.approved_at = null;
  }

  const { data, error } = await guard.supabase
    .from("outgoing_messages")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: data });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireMailAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  // Cancelled rather than deleted: the camp wants to know what it decided not
  // to send as much as what it sent.
  const { error } = await guard.supabase
    .from("outgoing_messages")
    .update({ status: "cancelled" })
    .eq("id", id)
    .neq("status", "sent");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ cancelled: true });
}

import { requireArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import StaffHeader from "@/components/StaffHeader";
import MailQueueClient, { type QueuedMessage } from "./MailQueueClient";

export const dynamic = "force-dynamic";

/**
 * The review queue.
 *
 * This page only reads. Approving and sending are explicit actions behind the
 * /api/mail routes, and the actual posting happens on the dispatch cron, so
 * opening this screen can never put a letter in the post.
 */
export default async function MailQueuePage() {
  await requireArea("admin", "/admin/mail");
  const supabase = await createClient();

  const { data } = await supabase
    .from("outgoing_messages")
    .select(
      "id, subject, body, audience_label, recipients, source_view, scheduled_for, status, " +
        "approved_at, sent_at, failure_reason, created_at, template_id"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const messages: QueuedMessage[] = ((data ?? []) as Record<string, unknown>[]).map((m) => ({
    id: String(m.id),
    subject: String(m.subject ?? ""),
    body: String(m.body ?? ""),
    audienceLabel: String(m.audience_label ?? ""),
    recipients: Array.isArray(m.recipients) ? (m.recipients as QueuedMessage["recipients"]) : [],
    sourceView: (m.source_view as string) ?? null,
    scheduledFor: (m.scheduled_for as string) ?? null,
    status: String(m.status ?? "draft") as QueuedMessage["status"],
    approvedAt: (m.approved_at as string) ?? null,
    sentAt: (m.sent_at as string) ?? null,
    failureReason: (m.failure_reason as string) ?? null,
    createdAt: (m.created_at as string) ?? null,
  }));

  return (
    <>
      <StaffHeader />
      <MailQueueClient messages={messages} />
    </>
  );
}

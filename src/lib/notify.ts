/**
 * Server-side inbound-lead notification.
 *
 * Posts a short JSON summary to whatever URL is configured in
 * INBOUND_WEBHOOK_URL (Slack incoming webhook, Zapier catch hook, n8n, etc.)
 * so a new signup is not silently buried in a table nobody watches.
 *
 * No URL is hardcoded. If the env var is unset the call is a no-op, and a
 * failing webhook never fails the user's submission.
 */

export interface InboundNotice {
  /** Short machine-readable label, e.g. "camp_signup" | "registration" | "volunteer". */
  kind: string;
  /** One-line human summary shown in the notification. */
  summary: string;
  /** Small flat bag of extra context. Keep it short — this goes to a chat client. */
  details?: Record<string, string | number | boolean | null>;
}

export async function notifyInbound(notice: InboundNotice): Promise<void> {
  const url = process.env.INBOUND_WEBHOOK_URL;
  if (!url) return;

  const payload = {
    source: "camperroster.com",
    kind: notice.kind,
    summary: notice.summary,
    // Slack/Discord-compatible: both render a top-level `text` field.
    text: `[camperroster] ${notice.summary}`,
    details: notice.details ?? {},
    received_at: new Date().toISOString(),
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    // Never let notification failure break the submission it is reporting on.
    console.error("notifyInbound failed:", err);
  }
}

"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  FilterBar,
  FilterChip,
  Notice,
  PageHeader,
  PageShell,
  StatCard,
  StatStrip,
  StatusDot,
  inputClass,
} from "@/components/ui";

export type Recipient = { email: string; name?: string | null; context?: string | null };

export type QueuedMessage = {
  id: string;
  subject: string;
  body: string;
  audienceLabel: string;
  recipients: Recipient[];
  sourceView: string | null;
  scheduledFor: string | null;
  status: "draft" | "awaiting_review" | "approved" | "sent" | "cancelled" | "failed";
  approvedAt: string | null;
  sentAt: string | null;
  failureReason: string | null;
  createdAt: string | null;
};

const TABS: { key: string; label: string; statuses: QueuedMessage["status"][] }[] = [
  { key: "review", label: "Awaiting review", statuses: ["awaiting_review", "draft"] },
  { key: "approved", label: "Approved & scheduled", statuses: ["approved"] },
  { key: "sent", label: "Sent", statuses: ["sent"] },
  { key: "closed", label: "Cancelled & failed", statuses: ["cancelled", "failed"] },
];

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MailQueueClient({
  messages,
  mailConfigured,
}: {
  messages: QueuedMessage[];
  mailConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState("review");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAddresses, setShowAddresses] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<Record<string, { subject: string; body: string; scheduledFor: string }>>({});

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const visible = useMemo(
    () => messages.filter((m) => active.statuses.includes(m.status)),
    [messages, active]
  );

  const draftOf = (m: QueuedMessage) =>
    edits[m.id] ?? { subject: m.subject, body: m.body, scheduledFor: toLocalInput(m.scheduledFor) };

  const setDraft = (id: string, patch: Partial<{ subject: string; body: string; scheduledFor: string }>) => {
    const base = edits[id] ?? {
      subject: messages.find((m) => m.id === id)?.subject ?? "",
      body: messages.find((m) => m.id === id)?.body ?? "",
      scheduledFor: toLocalInput(messages.find((m) => m.id === id)?.scheduledFor ?? null),
    };
    setEdits({ ...edits, [id]: { ...base, ...patch } });
  };

  const act = async (
    m: QueuedMessage,
    action: "save" | "approve" | "schedule" | "approve_and_schedule" | "cancel" | "unapprove",
    successMessage: string
  ) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const draft = draftOf(m);
      const body: Record<string, unknown> = { action };
      if (action !== "cancel" && action !== "unapprove") {
        body.subject = draft.subject;
        body.body = draft.body;
        if (draft.scheduledFor) body.scheduledFor = new Date(draft.scheduledFor).toISOString();
      }

      const res = await fetch(`/api/mail/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "That did not go through");

      setNotice(successMessage);
      setEdits((prev) => {
        const next = { ...prev };
        delete next[m.id];
        return next;
      });
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || pending;

  const counts = {
    review: messages.filter((m) => m.status === "awaiting_review" || m.status === "draft").length,
    approved: messages.filter((m) => m.status === "approved").length,
    sent: messages.filter((m) => m.status === "sent").length,
    failed: messages.filter((m) => m.status === "failed").length,
  };
  const waitingRecipients = messages
    .filter((m) => m.status === "awaiting_review" || m.status === "draft")
    .reduce((n, m) => n + m.recipients.length, 0);

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Outgoing mail"
        title="Review Queue"
        description="Nothing goes out unread. Each draft shows who it goes to, how it reads, and where the list came from. It only sends once you approve it, and only at the time you set."
        actions={
          <>
            <Link
              href="/admin/mail/templates"
              className="text-xs font-semibold text-forest-800 underline underline-offset-2"
            >
              Edit templates
            </Link>
            <Link href="/admin/exports" className="text-xs font-semibold text-forest-800 underline underline-offset-2">
              Build a group email
            </Link>
          </>
        }
      />

      {!mailConfigured && (
        <Notice tone="error">
          Email delivery is not configured. You can review and edit drafts, but approval and scheduled sending are
          disabled until the camp&apos;s SMTP settings are installed and verified.
        </Notice>
      )}

      <StatStrip>
        <StatCard
          label="Awaiting review"
          value={counts.review}
          tone={counts.review > 0 ? "pending" : "neutral"}
          hint={`${waitingRecipients} recipients behind these drafts.`}
        />
        <StatCard
          label="Approved & scheduled"
          value={counts.approved}
          tone="complete"
          hint="Will send at the time on the draft."
        />
        <StatCard label="Sent this season" value={counts.sent} tone="complete" hint="Already in families' inboxes." />
        <StatCard
          label="Failed"
          value={counts.failed}
          tone={counts.failed > 0 ? "overdue" : "neutral"}
          hint="Dispatch could not post these."
        />
      </StatStrip>

      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="ok">{notice}</Notice>}

      <FilterBar>
        {TABS.map((t) => {
          const count = messages.filter((m) => t.statuses.includes(m.status)).length;
          return (
            <FilterChip key={t.key} active={t.key === tab} onClick={() => setTab(t.key)}>
              {t.label} ({count})
            </FilterChip>
          );
        })}
      </FilterBar>

      {visible.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-12 text-center text-sm text-stone-500">
          Nothing here.
        </p>
      )}

      <div className="space-y-3">
        {visible.map((m) => {
            const draft = draftOf(m);
            const open = openId === m.id;
            const editable = m.status !== "sent" && m.status !== "cancelled";

            return (
              <article key={m.id} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-base font-bold text-stone-900">{m.subject}</h2>
                    <p className="mt-0.5 text-xs text-stone-500">{m.audienceLabel}</p>
                  </div>
                  <StatusDot status={m.status} className="shrink-0" />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                  <button
                    onClick={() => setShowAddresses({ ...showAddresses, [m.id]: !showAddresses[m.id] })}
                    className="font-semibold text-forest-800 underline underline-offset-2"
                  >
                    {m.recipients.length} recipient{m.recipients.length === 1 ? "" : "s"}
                    {showAddresses[m.id] ? " (hide addresses)" : " (view addresses)"}
                  </button>
                  {m.sourceView && (
                    <Link href={m.sourceView} className="font-semibold text-forest-800 underline underline-offset-2">
                      Where this list came from
                    </Link>
                  )}
                  {m.scheduledFor && <span>Sends {new Date(m.scheduledFor).toLocaleString()}</span>}
                  {m.sentAt && <span>Sent {new Date(m.sentAt).toLocaleString()}</span>}
                  {m.failureReason && <span className="text-alert-red">{m.failureReason}</span>}
                </div>

                {showAddresses[m.id] && (
                  <ul className="max-h-48 overflow-auto rounded-xl border border-stone-200 bg-stone-50 p-3 text-[11px] text-stone-600 space-y-0.5">
                    {m.recipients.map((r) => (
                      <li key={r.email} className="font-mono">
                        {r.email}
                        {r.context ? <span className="text-stone-500"> — {r.context}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  onClick={() => setOpenId(open ? null : m.id)}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline underline-offset-2"
                >
                  {open ? "Hide the draft" : "Read the draft"}
                </button>

                {open && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="font-mono text-[10px] font-bold uppercase text-stone-500">Subject</span>
                      <input
                        value={draft.subject}
                        disabled={!editable}
                        onChange={(e) => setDraft(m.id, { subject: e.target.value })}
                        className={inputClass + " mt-1 w-full disabled:bg-stone-50"}
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] font-bold uppercase text-stone-500">Body</span>
                      <textarea
                        value={draft.body}
                        disabled={!editable}
                        rows={14}
                        onChange={(e) => setDraft(m.id, { body: e.target.value })}
                        className={inputClass + " mt-1 w-full font-body leading-relaxed disabled:bg-stone-50"}
                      />
                    </label>
                    <label className="block max-w-xs">
                      <span className="font-mono text-[10px] font-bold uppercase text-stone-500">Send at</span>
                      <input
                        type="datetime-local"
                        value={draft.scheduledFor}
                        disabled={!editable}
                        onChange={(e) => setDraft(m.id, { scheduledFor: e.target.value })}
                        className={inputClass + " mt-1 w-full disabled:bg-stone-50"}
                      />
                    </label>
                  </div>
                )}

                {editable && (
                  <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={disabled}
                      onClick={() => act(m, "save", "Draft saved. It still needs approving before it can send.")}
                    >
                      Save edits
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={disabled}
                      onClick={() => act(m, "schedule", "Send time updated.")}
                    >
                      Update send time
                    </Button>
                    {m.status === "approved" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="border-sun-100 bg-sun-50 text-sun-600"
                        disabled={disabled}
                        onClick={() => act(m, "unapprove", "Pulled back out of the send queue.")}
                      >
                        Withdraw approval
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={disabled || !mailConfigured}
                        onClick={() =>
                          act(m, "approve_and_schedule", "Approved. It will send at the time on the draft.")
                        }
                      >
                        Approve &amp; schedule
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-auto"
                      disabled={disabled}
                      onClick={() => act(m, "cancel", "Cancelled. It will not be sent.")}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </article>
            );
        })}
      </div>
    </PageShell>
  );
}

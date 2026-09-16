"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

const STATUS_STYLES: Record<QueuedMessage["status"], string> = {
  draft: "bg-stone-100 text-stone-700 border-stone-200",
  awaiting_review: "bg-sun-50 text-sun-600 border-sun-100",
  approved: "bg-forest-50 text-forest-800 border-forest-100",
  sent: "bg-forest-50 text-forest-700 border-forest-100",
  cancelled: "bg-stone-100 text-stone-500 border-stone-200",
  failed: "bg-alert-red-bg text-alert-red border-alert-red-border",
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

export default function MailQueueClient({ messages }: { messages: QueuedMessage[] }) {
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

  return (
    <main className="py-8 lg:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
              Outgoing Mail
            </span>
            <h1 className="font-display font-black text-3xl text-stone-900 mt-2">Review Queue</h1>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl">
              Nothing goes out unread. Each draft below shows who it goes to, how it reads, and where the list came
              from. It only sends once you approve it, and only at the time you set.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/mail/templates" className="text-xs font-semibold text-forest-800 underline underline-offset-2">
              Edit templates
            </Link>
            <Link href="/admin/exports" className="text-xs font-semibold text-forest-800 underline underline-offset-2">
              Build a group email
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-alert-red-border bg-alert-red-bg px-4 py-3 text-sm text-alert-red">{error}</div>
        )}
        {notice && (
          <div className="rounded-xl border border-forest-100 bg-forest-50 px-4 py-3 text-sm text-forest-800">{notice}</div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const count = messages.filter((m) => t.statuses.includes(m.status)).length;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  t.key === tab
                    ? "rounded-full border border-forest-700 bg-forest-800 px-3 py-1.5 text-xs font-bold text-white"
                    : "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:border-stone-300"
                }
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>

        {visible.length === 0 && (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">
            Nothing here.
          </p>
        )}

        <div className="space-y-4">
          {visible.map((m) => {
            const draft = draftOf(m);
            const open = openId === m.id;
            const editable = m.status !== "sent" && m.status !== "cancelled";

            return (
              <article key={m.id} className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display font-bold text-base text-stone-900 truncate">{m.subject}</h2>
                    <p className="text-xs text-stone-500 mt-0.5">{m.audienceLabel}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${STATUS_STYLES[m.status]}`}>
                    {m.status.replace(/_/g, " ")}
                  </span>
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
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:bg-stone-50"
                      />
                    </label>
                    <label className="block">
                      <span className="font-mono text-[10px] font-bold uppercase text-stone-500">Body</span>
                      <textarea
                        value={draft.body}
                        disabled={!editable}
                        rows={14}
                        onChange={(e) => setDraft(m.id, { body: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-body leading-relaxed disabled:bg-stone-50"
                      />
                    </label>
                    <label className="block max-w-xs">
                      <span className="font-mono text-[10px] font-bold uppercase text-stone-500">Send at</span>
                      <input
                        type="datetime-local"
                        value={draft.scheduledFor}
                        disabled={!editable}
                        onChange={(e) => setDraft(m.id, { scheduledFor: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:bg-stone-50"
                      />
                    </label>
                  </div>
                )}

                {editable && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      disabled={disabled}
                      onClick={() => act(m, "save", "Draft saved. It still needs approving before it can send.")}
                      className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
                    >
                      Save edits
                    </button>
                    <button
                      disabled={disabled}
                      onClick={() => act(m, "schedule", "Send time updated.")}
                      className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
                    >
                      Update send time
                    </button>
                    {m.status === "approved" ? (
                      <button
                        disabled={disabled}
                        onClick={() => act(m, "unapprove", "Pulled back out of the send queue.")}
                        className="rounded-lg border border-sun-100 bg-sun-50 px-3 py-1.5 text-xs font-bold text-sun-600 disabled:opacity-40"
                      >
                        Withdraw approval
                      </button>
                    ) : (
                      <button
                        disabled={disabled}
                        onClick={() =>
                          act(m, "approve_and_schedule", "Approved. It will send at the time on the draft.")
                        }
                        className="rounded-lg bg-forest-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-forest-900 disabled:opacity-40"
                      >
                        Approve &amp; schedule
                      </button>
                    )}
                    <button
                      disabled={disabled}
                      onClick={() => act(m, "cancel", "Cancelled. It will not be sent.")}
                      className="rounded-lg border border-alert-red-border bg-alert-red-bg px-3 py-1.5 text-xs font-bold text-alert-red disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}

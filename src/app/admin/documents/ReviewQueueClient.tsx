"use client";

import { useState } from "react";
import type { ReviewRow } from "./data";

const KIND_BADGE: Record<string, string> = {
  camper: "bg-forest-50 text-forest-800 border-forest-100",
  teen_volunteer: "bg-sun-50 text-sun-600 border-sun-100",
  adult_volunteer: "bg-stone-100 text-stone-700 border-stone-200",
};

/**
 * The review queue is the only interactive part of the page: approve, reject
 * with a reason, or open the scan. Opening a scan asks the server for a fresh
 * signed URL each time — there is no durable link to a medical document.
 */
export default function ReviewQueueClient({ initialRows }: { initialRows: ReviewRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function view(recordId: string) {
    setError(null);
    const res = await fetch("/api/documents/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Could not open that document.");
      return;
    }
    window.open(body.url, "_blank", "noopener,noreferrer");
  }

  async function review(recordId: string, action: "approve" | "reject", rejectReason?: string) {
    setBusyId(recordId);
    setError(null);
    try {
      const res = await fetch("/api/documents/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "approve" ? { action, recordId } : { action, recordId, reason: rejectReason },
        ),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "That review could not be saved.");
        return;
      }
      setRows((prev) => prev.filter((r) => r.recordId !== recordId));
      setRejecting(null);
      setReason("");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-stone-500">Nothing waiting for review. The queue is clear.</p>;
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-lg border border-alert-red-border bg-alert-red-bg px-3 py-2 text-sm text-alert-red">
          {error}
        </p>
      )}
      {rows.map((row) => (
        <div key={row.recordId} className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900">{row.personName}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    KIND_BADGE[row.kind] ?? KIND_BADGE.adult_volunteer
                  }`}
                >
                  {row.kind.replace("_", " ")}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-stone-600">
                {row.typeName}
                {row.submittedAt && ` • submitted ${new Date(row.submittedAt).toLocaleDateString()}`}
                {!row.hasFile && " • signed, no scan"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {row.hasFile && (
                <button
                  onClick={() => view(row.recordId)}
                  className="rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  View
                </button>
              )}
              <button
                disabled={busyId === row.recordId}
                onClick={() => review(row.recordId, "approve")}
                className="rounded-full bg-forest-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-forest-700 disabled:bg-stone-300"
              >
                Approve
              </button>
              <button
                disabled={busyId === row.recordId}
                onClick={() => setRejecting(rejecting === row.recordId ? null : row.recordId)}
                className="rounded-full border border-alert-red-border bg-alert-red-bg px-3.5 py-1.5 text-xs font-semibold text-alert-red"
              >
                Reject
              </button>
            </div>
          </div>

          {rejecting === row.recordId && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-3">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this going back? e.g. back of the card is unreadable"
                className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-forest-600 focus:outline-none"
              />
              <button
                disabled={reason.trim().length < 5 || busyId === row.recordId}
                onClick={() => review(row.recordId, "reject", reason.trim())}
                className="rounded-full bg-alert-red px-4 py-2 text-xs font-semibold text-white disabled:bg-stone-300"
              >
                Send back
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

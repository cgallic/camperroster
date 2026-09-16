"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  FilterChip,
  Notice,
  StatusDot,
  inputClass,
  type Column,
} from "@/components/ui";
import type { ReviewRow } from "./data";

const KIND_LABEL: Record<string, string> = {
  camper: "Camper",
  teen_volunteer: "Teen",
  adult_volunteer: "Adult",
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
  const [kindFilter, setKindFilter] = useState<string | null>(null);

  const kinds = useMemo(() => [...new Set(rows.map((r) => r.kind))], [rows]);
  const visible = useMemo(() => (kindFilter ? rows.filter((r) => r.kind === kindFilter) : rows), [rows, kindFilter]);
  const rejectingRow = rows.find((r) => r.recordId === rejecting) ?? null;

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

  const columns: Column<ReviewRow>[] = [
    {
      key: "person",
      header: "Person",
      primary: true,
      cell: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-stone-900">{row.personName}</span>
          <Badge>{KIND_LABEL[row.kind] ?? row.kind}</Badge>
        </div>
      ),
    },
    {
      key: "type",
      header: "Document",
      cell: (row) => (
        <div>
          <span className="text-stone-800">{row.typeName}</span>
          {!row.hasFile && <div className="mt-0.5 text-[11px] text-stone-500">signed, no scan</div>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: () => <StatusDot tone="pending" label="Awaiting review" />,
    },
    {
      key: "submitted",
      header: "Submitted",
      align: "right",
      cell: (row) => (
        <span className="text-xs text-stone-500">
          {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      action: true,
      cell: (row) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {row.hasFile && (
            <Button variant="quiet" size="sm" onClick={() => view(row.recordId)}>
              View
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            disabled={busyId === row.recordId}
            onClick={() => review(row.recordId, "approve")}
          >
            Approve
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={busyId === row.recordId}
            onClick={() => setRejecting(rejecting === row.recordId ? null : row.recordId)}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {error && <Notice tone="error">{error}</Notice>}

      {kinds.length > 1 && (
        <FilterBar
          trailing={
            <span className="text-xs text-stone-500">
              {visible.length} of {rows.length} shown
            </span>
          }
        >
          <FilterChip active={kindFilter === null} onClick={() => setKindFilter(null)}>
            Everyone
          </FilterChip>
          {kinds.map((kind) => (
            <FilterChip key={kind} active={kindFilter === kind} onClick={() => setKindFilter(kind)}>
              {KIND_LABEL[kind] ?? kind}
            </FilterChip>
          ))}
        </FilterBar>
      )}

      <DataTable
        columns={columns}
        rows={visible}
        rowKey={(row) => row.recordId}
        empty="Nothing waiting for review. The queue is clear."
      />

      {rejectingRow && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-alert-red-border bg-alert-red-bg p-3">
          <span className="text-xs font-bold text-alert-red">
            Sending back {rejectingRow.typeName} for {rejectingRow.personName}
          </span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this going back? e.g. back of the card is unreadable"
            className={inputClass + " min-w-0 flex-1"}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setRejecting(null);
              setReason("");
            }}
          >
            Keep it
          </Button>
          <Button
            variant="primary"
            className="bg-alert-red hover:bg-alert-red"
            disabled={reason.trim().length < 5 || busyId === rejectingRow.recordId}
            onClick={() => review(rejectingRow.recordId, "reject", reason.trim())}
          >
            Send back
          </Button>
        </div>
      )}
    </div>
  );
}

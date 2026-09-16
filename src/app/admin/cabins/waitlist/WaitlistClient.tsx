"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  DataTable,
  Notice,
  PageHeader,
  Panel,
  PageShell,
  StatCard,
  StatStrip,
  StatusDot,
  selectClass,
  type Column,
} from "@/components/ui";
import { bucketLabel, genderLabel, waitingFor, type CabinRow, type WaitlistRow } from "../types";

export default function WaitlistClient({
  entries,
  cabins,
}: {
  entries: WaitlistRow[];
  cabins: CabinRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [targets, setTargets] = useState<Record<string, string>>({});

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; entries: WaitlistRow[] }>();
    for (const entry of entries) {
      const key = `${entry.gender ?? "none"}|${entry.grade ?? "?"}`;
      const label = `${genderLabel(entry.gender)} • Grade ${entry.grade ?? "unknown"}`;
      if (!map.has(key)) map.set(key, { key, label, entries: [] });
      map.get(key)!.entries.push(entry);
    }
    for (const group of map.values()) group.entries.sort((a, b) => a.position - b.position);
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [entries]);

  /** Beds free right now across every open cabin — the number that decides how far down this queue we can go today. */
  const openSpots = useMemo(
    () => cabins.filter((c) => c.isOpen).reduce((n, c) => n + Math.max(0, c.spotsRemaining), 0),
    [cabins],
  );

  const longestWait = useMemo(() => {
    if (entries.length === 0) return null;
    const oldest = entries.reduce((a, b) => (new Date(a.createdAt) < new Date(b.createdAt) ? a : b));
    return waitingFor(oldest.createdAt);
  }, [entries]);

  const promote = async (entry: WaitlistRow) => {
    setBusy(true);
    setError(null);
    setOkMessage(null);
    try {
      const cabinId = targets[entry.id] || undefined;
      const res = await fetch("/api/cabins/waitlist/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitlistEntryId: entry.id, cabinId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Could not promote that camper");
      setOkMessage(`${entry.name} placed in a cabin and marked accepted.`);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || pending;

  const columnsFor = (group: { entries: WaitlistRow[] }): Column<WaitlistRow>[] => [
    {
      key: "name",
      header: "Camper",
      primary: true,
      cell: (entry) => (
        <div className="min-w-0">
          <span className="font-semibold text-stone-900">
            {group.entries.indexOf(entry) + 1}. {entry.name}
          </span>
          <div className="mt-0.5 text-[11px] text-stone-500">position #{entry.position}</div>
        </div>
      ),
    },
    {
      key: "waiting",
      header: "Waiting",
      align: "right",
      cell: (entry) => <span className="text-xs text-stone-600">{waitingFor(entry.createdAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (entry) => <StatusDot status={entry.status} />,
    },
    {
      key: "place",
      header: "Place into",
      action: true,
      cell: (entry) => {
        const eligible = cabins.filter(
          (c) =>
            c.gender === entry.gender &&
            (entry.grade === null ||
              c.minGrade === null ||
              c.maxGrade === null ||
              (entry.grade >= c.minGrade && entry.grade <= c.maxGrade)),
        );
        return (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <select
              value={targets[entry.id] ?? ""}
              onChange={(e) => setTargets((prev) => ({ ...prev, [entry.id]: e.target.value }))}
              className={selectClass}
            >
              <option value="">Auto-place</option>
              {eligible.map((c) => (
                <option key={c.cabinId} value={c.cabinId}>
                  {c.name} ({c.campersAssigned}/{c.capacity}) — {bucketLabel(c.gender, c.minGrade, c.maxGrade)}
                </option>
              ))}
            </select>
            <Button variant="primary" size="sm" disabled={disabled} onClick={() => void promote(entry)}>
              Promote
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Waitlist queue"
        title="Waiting For A Spot"
        description="Ordered by position, which is the order families signed up. Promote from the top of each bucket."
      />

      {error && <Notice tone="error">{error}</Notice>}
      {okMessage && <Notice tone="ok">{okMessage}</Notice>}

      <StatStrip className="lg:grid-cols-3">
        <StatCard
          label="On the waitlist"
          value={entries.length}
          tone={entries.length > 0 ? "waitlisted" : "neutral"}
          hint={`${groups.length} ${groups.length === 1 ? "bucket" : "buckets"} by gender and grade`}
        />
        <StatCard
          label="Beds free today"
          value={openSpots}
          tone={openSpots > 0 ? "complete" : "overdue"}
          hint="Across cabins still open for placement."
        />
        <StatCard
          label="Longest wait"
          value={longestWait ?? "—"}
          tone={entries.length > 0 ? "pending" : "neutral"}
          hint="Since the first family in this queue signed up."
        />
      </StatStrip>

      {groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          Nobody is on the waitlist.
        </div>
      )}

      {groups.map((group) => (
        <Panel
          key={group.key}
          title={group.label}
          description={`${group.entries.length} waiting`}
          bodyClassName="p-0"
        >
          <DataTable
            columns={columnsFor(group)}
            rows={group.entries}
            rowKey={(entry) => entry.id}
            empty="Nobody in this bucket."
            className="rounded-none border-0"
          />
        </Panel>
      ))}
    </PageShell>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Search } from "lucide-react";
import { Badge, Button, FilterBar, FilterChip, Notice, StatCard, StatStrip, inputClass } from "@/components/ui";
import {
  MEETING_FILTERS,
  MEETING_FILTER_LABELS,
  filterRoster,
  rosterCounts,
  type MeetingFilter,
  type MeetingRosterRow,
} from "@/lib/meeting-checkin";
import { setMeetingSignIn } from "../actions";

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function MeetingRosterClient({ meetingId, initialRows }: { meetingId: string; initialRows: MeetingRosterRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState<MeetingFilter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const counts = rosterCounts(rows);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = filterRoster(rows, filter);
    return needle ? filtered.filter((r) => r.name.toLowerCase().includes(needle)) : filtered;
  }, [rows, filter, query]);

  const toggle = (row: MeetingRosterRow) => {
    setBusyId(row.id);
    startTransition(async () => {
      const result = await setMeetingSignIn({ meetingId, staffApplicationId: row.id, signedIn: !row.signedInAt });
      setBusyId(null);
      if (!result.ok) return setError(result.message);
      setError(null);
      setRows((current) => current.map((r) => (r.id === row.id ? { ...r, signedInAt: result.signedInAt ?? null } : r)));
    });
  };

  return (
    <div className="space-y-4">
      <StatStrip>
        <StatCard label="Expected" value={counts.expected} tone="neutral" hint="Volunteer and staff applications." />
        <StatCard
          label="Signed in"
          value={counts.signedIn}
          of={counts.expected}
          tone="complete"
          progress={counts.expected ? (counts.signedIn / counts.expected) * 100 : 0}
          progressLabel="signed in"
        />
        <StatCard
          label="Missing documents"
          value={counts.missingDocs}
          tone={counts.missingDocs > 0 ? "overdue" : "complete"}
          hint="Required documents not yet approved."
        />
        <StatCard label="All set" value={counts.ready} tone="complete" hint="Signed in with every document in." />
      </StatStrip>

      {error && <Notice tone="error">{error}</Notice>}

      <FilterBar
        trailing={
          <label className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a name"
              aria-label="Find a name"
              className={`${inputClass} pl-8`}
            />
          </label>
        }
      >
        {MEETING_FILTERS.map((f) => (
          <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {MEETING_FILTER_LABELS[f]}
          </FilterChip>
        ))}
      </FilterBar>

      <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {visible.map((row) => (
          <li key={row.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-stone-900">{row.name}</span>
                <span className="text-xs text-stone-500">
                  {row.kind === "teen_volunteer" ? "Teen" : "Adult"}
                  {row.role ? ` · ${row.role}` : ""}
                </span>
              </div>
              {row.docsComplete ? (
                <p className="mt-1 text-xs font-semibold text-forest-800">All required documents in</p>
              ) : (
                <p className="mt-1 text-xs text-alert-red">Missing: {row.outstanding.join(", ")}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {row.signedInAt ? (
                <>
                  <Badge tone="complete">Signed in {timeOf(row.signedInAt)}</Badge>
                  <Button type="button" variant="quiet" size="sm" onClick={() => toggle(row)} disabled={busyId === row.id}>
                    Undo
                  </Button>
                </>
              ) : (
                <Button type="button" variant="primary" onClick={() => toggle(row)} disabled={busyId === row.id}>
                  <Check className="h-3.5 w-3.5" />
                  Sign in
                </Button>
              )}
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-stone-500">
            {rows.length === 0 ? "No volunteer or staff applications yet." : "Nobody matches this filter."}
          </li>
        )}
      </ul>
    </div>
  );
}

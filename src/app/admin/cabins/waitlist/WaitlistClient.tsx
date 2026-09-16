"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

  return (
    <main className="py-8 lg:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
            Waitlist Queue
          </span>
          <h1 className="font-display font-black text-3xl text-stone-900 mt-2">Waiting For A Spot</h1>
          <p className="text-xs text-stone-500 mt-1">
            Ordered by position, which is the order families signed up. Promote from the top of each bucket.
          </p>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-xs font-semibold bg-alert-red-bg border border-alert-red-border text-alert-red">
            {error}
          </div>
        )}
        {okMessage && (
          <div className="rounded-xl px-4 py-3 text-xs font-semibold bg-forest-50 border border-forest-100 text-forest-800">
            {okMessage}
          </div>
        )}

        {groups.length === 0 && (
          <div className="double-bezel p-8 text-center text-sm text-stone-500">Nobody is on the waitlist.</div>
        )}

        {groups.map((group) => (
          <section key={group.key} className="double-bezel overflow-hidden">
            <div className="p-5 bg-white border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-display font-extrabold text-base text-stone-900">{group.label}</h2>
              <span className="font-mono text-[11px] font-bold text-stone-600 bg-stone-50 px-2.5 py-1 rounded-full border border-stone-100">
                {group.entries.length} waiting
              </span>
            </div>
            <div className="divide-y divide-stone-100 text-xs">
              {group.entries.map((entry, idx) => {
                const eligible = cabins.filter(
                  (c) =>
                    c.gender === entry.gender &&
                    (entry.grade === null ||
                      c.minGrade === null ||
                      c.maxGrade === null ||
                      (entry.grade >= c.minGrade && entry.grade <= c.maxGrade)),
                );
                return (
                  <div key={entry.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-48">
                      <b className="text-sm font-extrabold text-stone-900 block">
                        {idx + 1}. {entry.name}
                      </b>
                      <span className="text-stone-500 text-[11px]">
                        position #{entry.position} · waiting {waitingFor(entry.createdAt)} · {entry.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={targets[entry.id] ?? ""}
                        onChange={(e) => setTargets((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                        className="rounded-lg border border-stone-200 px-2 py-1 text-[11px]"
                      >
                        <option value="">Auto-place</option>
                        {eligible.map((c) => (
                          <option key={c.cabinId} value={c.cabinId}>
                            {c.name} ({c.campersAssigned}/{c.capacity}) — {bucketLabel(c.gender, c.minGrade, c.maxGrade)}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={disabled}
                        onClick={() => void promote(entry)}
                        className="px-3 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold cursor-pointer"
                      >
                        Promote
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

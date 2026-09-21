"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, CheckCircle2, Loader2, Search, UserRoundSearch } from "lucide-react";
import { formatMoney, safeApiMessage } from "@/lib/operations";

type Registration = {
  id: string; name: string; legalName: string | null; grade: number | null; status: string | null;
  cabin: string | null; counselor: string | null; canteenBalanceCents: number; checkedIn: boolean; checkedInAt: string | null;
};

export default function ExpressCheckinPage() {
  const [campName, setCampName] = useState("Camp");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/checkin", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(safeApiMessage(payload, "Could not load the check-in roster."));
        if (!active) return;
        setCampName(payload.camp?.campName || "Camp");
        setRegistrations(payload.registrations || []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load the check-in roster.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return registrations;
    return registrations.filter((registration) =>
      [registration.name, registration.legalName, registration.cabin].filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [query, registrations]);
  const selected = registrations.find((registration) => registration.id === selectedId) ?? null;

  async function checkIn() {
    if (!selected || selected.checkedIn || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/checkin", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ registration_id: selected.id, checked_in: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(safeApiMessage(payload, "Check-in was not saved."));
      setRegistrations((current) => current.map((registration) => registration.id === selected.id
        ? { ...registration, checkedIn: true, checkedInAt: payload.registration?.checked_in_at ?? new Date().toISOString() }
        : registration));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in was not saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full uppercase">Live registration roster</span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">Gate check-in</h1>
          <p className="text-sm text-stone-600 mt-1">{campName} · Every confirmation is saved to the registration record.</p>
        </div>
        <Link href="/admin" className="px-4 py-2 rounded-full bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200 w-max">← Director hub</Link>
      </div>

      <div className="bg-white rounded-2xl p-4 border-2 border-stone-200 shadow-sm">
        <label htmlFor="camper-search" className="sr-only">Search campers</label>
        <div className="relative">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input id="camper-search" type="search" placeholder="Search by camper or cabin" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-stone-300 text-stone-900 font-bold focus:border-forest-800 focus:outline-none" />
        </div>
      </div>

      {error && <div role="alert" className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 font-semibold text-sm flex items-center gap-2"><AlertTriangle className="w-5 h-5 shrink-0" /> {error}</div>}

      {loading ? (
        <div className="py-16 text-center text-stone-500"><Loader2 className="w-7 h-7 animate-spin mx-auto mb-3" />Loading the live roster…</div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-stone-300 py-16 px-6 text-center">
          <UserRoundSearch className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h2 className="font-display font-black text-xl text-stone-900">No current registrations</h2>
          <p className="text-sm text-stone-600 mt-2">Historical roster records are not treated as active arrivals. New registrations will appear here.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 items-start">
          <div className="bg-white rounded-2xl border-2 border-stone-200 divide-y divide-stone-100 overflow-hidden">
            {matches.length === 0 ? <p className="p-8 text-center text-sm text-stone-500">No campers match that search.</p> : matches.map((registration) => (
              <button key={registration.id} type="button" onClick={() => setSelectedId(registration.id)} className={`w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-stone-50 ${selectedId === registration.id ? "bg-forest-50" : "bg-white"}`}>
                <span><b className="block text-stone-950">{registration.name}</b><span className="text-xs text-stone-500">{registration.cabin || "Cabin not assigned"}{registration.grade !== null ? ` · Grade ${registration.grade}` : ""}</span></span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${registration.checkedIn ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{registration.checkedIn ? "Present" : "Awaiting"}</span>
              </button>
            ))}
          </div>

          {selected ? (
            <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-300 shadow-lg space-y-6">
              <div><span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Selected camper</span><h2 className="font-display font-black text-3xl text-stone-900">{selected.name}</h2>{selected.legalName && selected.legalName !== selected.name && <p className="text-xs text-stone-500">Legal name: {selected.legalName}</p>}</div>
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="p-4 rounded-2xl bg-stone-50"><dt className="text-[10px] font-bold uppercase text-stone-500">Cabin</dt><dd className="font-black text-stone-900">{selected.cabin || "Not assigned"}</dd></div>
                <div className="p-4 rounded-2xl bg-stone-50"><dt className="text-[10px] font-bold uppercase text-stone-500">Counselor</dt><dd className="font-black text-stone-900">{selected.counselor || "Not assigned"}</dd></div>
                <div className="p-4 rounded-2xl bg-stone-50"><dt className="text-[10px] font-bold uppercase text-stone-500">Registration</dt><dd className="font-black text-stone-900 capitalize">{selected.status || "Unknown"}</dd></div>
                <div className="p-4 rounded-2xl bg-stone-50"><dt className="text-[10px] font-bold uppercase text-stone-500">Canteen balance</dt><dd className="font-black text-stone-900">{formatMoney(selected.canteenBalanceCents)}</dd></div>
              </dl>
              {selected.checkedIn ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-950 font-bold text-sm flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Checked in{selected.checkedInAt ? ` at ${new Date(selected.checkedInAt).toLocaleString()}` : ""}.</div>
              ) : (
                <button type="button" onClick={checkIn} disabled={saving} className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center justify-center gap-2 disabled:opacity-60">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} Confirm check-in</button>
              )}
            </section>
          ) : <div className="rounded-3xl border-2 border-dashed border-stone-300 p-12 text-center text-sm text-stone-500">Select a camper to review and check in.</div>}
        </div>
      )}
    </main>
  );
}

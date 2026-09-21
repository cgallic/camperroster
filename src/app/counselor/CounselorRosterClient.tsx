"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, Users } from "lucide-react";
import { ageOnDate, safeApiMessage } from "@/lib/operations";

type Registration = {
  id: string; name: string; legalName: string | null; birthDate: string | null; grade: number | null;
  buddyRequests: string[]; checkedIn: boolean; cabinId: string | null; cabin: string | null; counselor: string | null;
};

export default function CounselorRosterPage() {
  const [campName, setCampName] = useState("Camp");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/counselor/roster", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(safeApiMessage(payload, "Could not load the counselor roster."));
        if (!active) return;
        setCampName(payload.camp?.campName || "Camp");
        setRegistrations(payload.registrations || []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load the counselor roster.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const grouped = useMemo(() => {
    const groups = new Map<string, Registration[]>();
    for (const registration of registrations) {
      const label = registration.cabin || "Unassigned cabin";
      groups.set(label, [...(groups.get(label) || []), registration]);
    }
    return [...groups.entries()];
  }, [registrations]);

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      <header className="bg-forest-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">Live counselor roster</span>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-white mt-3">{campName}</h1>
        <p className="text-sm text-stone-300 mt-1">Cabin assignments and arrival status from current registrations.</p>
        <Link href="/admin" className="inline-block mt-4 text-xs font-bold text-emerald-300 hover:text-white">← Staff home</Link>
      </header>

      <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-xs">
        This roster intentionally excludes parent contact and medical details. Ask a director or nurse when you need information outside the counselor role.
      </div>
      {error && <div role="alert" className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 font-semibold text-sm flex items-center gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</div>}

      {loading ? (
        <div className="py-16 text-center text-stone-500"><Loader2 className="w-7 h-7 animate-spin mx-auto mb-3" />Loading current registrations…</div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-stone-300 py-16 px-6 text-center">
          <Users className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h2 className="font-display font-black text-xl text-stone-900">No current campers</h2>
          <p className="text-sm text-stone-600 mt-2">Historical roster entries are not active cabin assignments. Current registrations will appear here.</p>
        </div>
      ) : grouped.map(([cabin, campers]) => (
        <section key={cabin} className="space-y-3">
          <div className="flex items-end justify-between border-b-2 border-stone-200 pb-2">
            <div><h2 className="font-display font-black text-xl text-stone-950">{cabin}</h2><p className="text-xs text-stone-500">{campers.map((camper) => camper.counselor).find(Boolean) || "Counselor not assigned"}</p></div>
            <span className="text-xs font-bold text-stone-500">{campers.length} camper{campers.length === 1 ? "" : "s"}</span>
          </div>
          <div className="space-y-3">
            {campers.map((camper) => {
              const age = ageOnDate(camper.birthDate);
              return (
                <article key={camper.id} className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-stone-200 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="font-display font-black text-lg text-stone-900">{camper.name}</h3><p className="text-xs text-stone-500">{age !== null ? `Age ${age}` : "Age not recorded"}{camper.grade !== null ? ` · Grade ${camper.grade}` : ""}</p></div>
                    <span className={`px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1 ${camper.checkedIn ? "bg-emerald-100 text-emerald-950" : "bg-amber-100 text-amber-950"}`}>{camper.checkedIn ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock3 className="w-3.5 h-3.5" />}{camper.checkedIn ? "Present" : "Not checked in"}</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-stone-100 text-xs text-stone-600"><b>Buddy request:</b> {camper.buddyRequests.length ? camper.buddyRequests.join(", ") : "None recorded"}</div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}

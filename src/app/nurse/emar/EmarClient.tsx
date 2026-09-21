"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Loader2, Pill, Stethoscope } from "lucide-react";
import { medicationWindow, safeApiMessage, type MedicationWindow } from "@/lib/operations";

type Medication = {
  id: string; camperName: string; grade: number | null; medication: string; dosage: string;
  scheduledTime: string; administeredAt: string | null; administeredBy: string; notes: string | null;
};
type Tab = MedicationWindow | "all";

export default function NurseEmarPage() {
  const [campName, setCampName] = useState("Camp");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/nurse/emar", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(safeApiMessage(payload, "Could not load medication records."));
        if (!active) return;
        setCampName(payload.camp?.campName || "Camp");
        setMedications(payload.medications || []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load medication records.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => medications.filter((item) => activeTab === "all" || medicationWindow(item.scheduledTime) === activeTab), [activeTab, medications]);

  async function administer(item: Medication) {
    if (item.administeredAt || savingId) return;
    setSavingId(item.id);
    setError(null);
    try {
      const response = await fetch("/api/nurse/emar", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ medication_id: item.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(safeApiMessage(payload, "The administration record was not saved."));
      setMedications((current) => current.map((medication) => medication.id === item.id ? {
        ...medication,
        administeredAt: payload.medication.administered_at,
        administeredBy: payload.medication.administered_by,
        notes: payload.medication.notes,
      } : medication));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The administration record was not saved.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-7">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1">
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900"><ArrowLeft className="w-4 h-4" />Director hub</Link>
            <h1 className="font-display font-black text-3xl text-stone-900 flex items-center gap-3"><Stethoscope className="w-8 h-8 text-forest-800" />Medication administration</h1>
            <p className="text-sm text-stone-600">{campName} · Scheduled records from the live medical ledger.</p>
          </div>
          <div className="flex flex-wrap gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs font-bold">
            {(["all", "breakfast", "lunch", "dinner", "bedtime"] as Tab[]).map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-3 py-2 rounded-xl uppercase tracking-wider text-[10px] ${activeTab === tab ? "bg-white text-forest-950 shadow-sm" : "text-stone-500"}`}>{tab}</button>
            ))}
          </div>
        </div>

        {error && <div role="alert" className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 font-semibold text-sm flex items-center gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</div>}
        {loading ? (
          <div className="py-16 text-center text-stone-500"><Loader2 className="w-7 h-7 animate-spin mx-auto mb-3" />Loading medication records…</div>
        ) : medications.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-stone-300 py-16 px-6 text-center">
            <Pill className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h2 className="font-display font-black text-xl text-stone-900">No medication schedule is configured</h2>
            <p className="text-sm text-stone-600 mt-2">Medication details on health forms do not automatically create doses. A nurse must add scheduled eMAR records before they can be administered here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-stone-300 p-12 text-center text-sm text-stone-500">No doses are scheduled for this round.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((item) => {
              const done = Boolean(item.administeredAt);
              return (
                <article key={item.id} className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm p-6 space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div><span className="font-mono text-[10px] font-bold text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full uppercase">{item.grade !== null ? `Grade ${item.grade}` : "Grade not recorded"}</span><h2 className="font-display font-black text-2xl text-stone-900 mt-2">{item.camperName}</h2></div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${done ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{done ? "Administered" : medicationWindow(item.scheduledTime)}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                      <b className="flex items-center gap-2 text-stone-950"><Pill className="w-4 h-4 text-forest-800" />{item.medication}</b>
                      <p className="text-sm text-stone-700 mt-1">{item.dosage}</p>
                      <p className="text-xs text-stone-500 mt-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Scheduled {new Date(item.scheduledTime).toLocaleString()}</p>
                      {item.notes && <p className="text-xs text-stone-600 mt-3 pt-3 border-t border-stone-200">{item.notes}</p>}
                    </div>
                  </div>
                  {done ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold"><CheckCircle2 className="w-4 h-4 inline mr-2" />Recorded {new Date(item.administeredAt!).toLocaleString()} by {item.administeredBy}</div>
                  ) : (
                    <button type="button" onClick={() => administer(item)} disabled={savingId !== null} className="w-full py-3.5 px-6 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50">{savingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}Record administered dose</button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

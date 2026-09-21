"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, Mail, Printer } from "lucide-react";
import { safeApiMessage } from "@/lib/operations";

type BunkNote = {
  id: string;
  camper_name: string;
  sender_name: string;
  sender_relation: string | null;
  message: string;
  delivery_date: string;
  created_at: string | null;
  printed: boolean | null;
};

export default function AdminBunkNotesPage() {
  const [notes, setNotes] = useState<BunkNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/portal/bunk-notes", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(safeApiMessage(payload, "Could not load bunk notes."));
        if (active) setNotes(payload.notes || []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load bunk notes.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-5 print:hidden">
        <div>
          <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-3 py-1 rounded-full uppercase">Live family messages</span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">Bunk notes</h1>
          <p className="text-sm text-stone-600 mt-1">{loading ? "Loading…" : `${notes.length} note${notes.length === 1 ? "" : "s"} ready for delivery`}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => window.print()} disabled={notes.length === 0} className="px-5 py-3 rounded-full bg-forest-900 text-white font-black text-xs flex items-center gap-2 disabled:opacity-40"><Printer className="w-4 h-4" />Print notes</button>
          <Link href="/admin" className="px-4 py-3 rounded-full bg-stone-100 text-stone-800 font-bold text-xs">← Admin</Link>
        </div>
      </div>

      {error && <div role="alert" className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 font-semibold text-sm flex items-center gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</div>}
      {loading ? (
        <div className="py-16 text-center text-stone-500"><Loader2 className="w-7 h-7 animate-spin mx-auto mb-3" />Loading bunk notes…</div>
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-stone-300 py-16 px-6 text-center">
          <Mail className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h2 className="font-display font-black text-xl text-stone-900">No bunk notes to print</h2>
          <p className="text-sm text-stone-600 mt-2">Family messages will appear here after they are submitted.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {notes.map((note) => (
            <article key={note.id} className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-stone-300 shadow-sm space-y-4 break-inside-avoid">
              <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-2 border-stone-200 pb-3">
                <div><span className="font-mono text-xs font-bold text-amber-800 uppercase block">Deliver to</span><h2 className="text-xl font-black text-stone-950">{note.camper_name}</h2></div>
                <div className="sm:text-right text-xs text-stone-500"><b className="block">From {note.sender_name}{note.sender_relation ? ` · ${note.sender_relation}` : ""}</b><span>Delivery date: {new Date(`${note.delivery_date}T00:00:00`).toLocaleDateString()}</span></div>
              </header>
              <p className="p-5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-base font-serif italic leading-relaxed">&ldquo;{note.message}&rdquo;</p>
              <footer className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Private bunk note · {note.printed ? "Previously marked printed" : "Not marked printed"}</footer>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

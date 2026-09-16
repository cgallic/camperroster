"use client";

import Link from "next/link";
import { Users, PhoneCall, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function CounselorRosterPage() {
  const campers = [
    {
      id: "c-1",
      name: "Jamie Gallic",
      age: "10 yrs (5th Grade)",
      parent: "Sarah Gallic",
      parentPhone: "(555) 234-5678",
      buddy: "Emma Gallic",
      allergy: "Peanut / Nut Allergy (EpiPen at Health Lodge)",
      checkedIn: true
    },
    {
      id: "c-2",
      name: "Emma Gallic",
      age: "10 yrs (5th Grade)",
      parent: "Sarah Gallic",
      parentPhone: "(555) 234-5678",
      buddy: "Jamie Gallic",
      allergy: "None",
      checkedIn: true
    },
    {
      id: "c-3",
      name: "Lucas Rivera",
      age: "11 yrs (5th Grade)",
      parent: "Maria Rivera",
      parentPhone: "(555) 481-9023",
      buddy: "Noah Smith",
      allergy: "Mild Asthma (Inhaler with Counselor)",
      checkedIn: true
    }
  ];

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      <div className="bg-forest-950 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
        <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
          COUNSELOR MOBILE ROSTER
        </span>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
          Cabin 4 • Timber Lodge
        </h1>
        <p className="text-xs sm:text-sm text-stone-300 font-medium">
          Counselors: Mark Henderson & Sarah Jenkins • 8 Campers Total
        </p>
      </div>

      <div className="space-y-4">
        {campers.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-lg text-stone-900">{c.name}</h3>
                <span className="text-xs text-stone-500 font-semibold">{c.age} • Buddy: {c.buddy}</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 font-bold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Present</span>
              </span>
            </div>

            {c.allergy !== "None" && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-bold text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{c.allergy}</span>
              </div>
            )}

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold">
              <span className="text-stone-600">Parent: {c.parent}</span>
              <a href={`tel:${c.parentPhone}`} className="text-forest-900 bg-forest-50 px-3 py-1.5 rounded-lg border border-forest-200 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{c.parentPhone}</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

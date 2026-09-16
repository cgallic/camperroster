"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Stethoscope, CheckCircle2, Clock, AlertTriangle, Pill } from "lucide-react";

export default function NurseEmarPage() {
  const [activeTab, setActiveTab] = useState("lunch");
  const [dispensed, setDispensed] = useState<string[]>([]);

  const schedule = [
    {
      id: "med_1",
      camper: "Jamie Gallic",
      grade: 4,
      cabin: "Pine 2",
      medication: "Methylphenidate (Ritalin)",
      dosage: "10mg Oral Tablet",
      time: "lunch",
      instructions: "Take with food at main dining hall lunch table. Water provided.",
      allergyAlert: "Severe Peanut Anaphylaxis • Carries EpiPen",
    },
    {
      id: "med_2",
      camper: "Tyler Reed",
      grade: 5,
      cabin: "Pine 3",
      medication: "Cetirizine (Zyrtec)",
      dosage: "10mg Chewable",
      time: "breakfast",
      instructions: "Seasonal allergy prevention before morning waterfront.",
      allergyAlert: "Bee Sting Sensitive",
    },
    {
      id: "med_3",
      camper: "Maya Ruiz",
      grade: 4,
      cabin: "Oak 1",
      medication: "Melatonin",
      dosage: "3mg Tablet",
      time: "bedtime",
      instructions: "Administer at 8:45 PM cabin lights-out.",
      allergyAlert: "No known food allergies",
    }
  ];

  const handleDispense = (id: string) => {
    if (!dispensed.includes(id)) {
      setDispensed([...dispensed, id]);
    }
  };

  const filtered = schedule.filter(m => activeTab === "all" || m.time === activeTab);

  return (
    <main className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Director Hub</span>
            </Link>
            <h1 className="font-display font-black text-3xl text-stone-900 flex items-center gap-3">
              <Stethoscope className="w-8 h-8 text-forest-800" />
              <span>Health Lodge eMAR Dispenser</span>
            </h1>
            <p className="text-xs text-stone-600">
              Electronic Medication Administration Record for Registered Nurses (RN/MD).
            </p>
          </div>

          <div className="flex gap-2 bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs font-bold">
            {["breakfast", "lunch", "dinner", "bedtime", "all"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-white text-forest-950 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(item => {
            const isDone = dispensed.includes(item.id);
            return (
              <div key={item.id} className="double-bezel-outer p-2">
                <div className="double-bezel-inner p-6 sm:p-8 space-y-6 flex flex-col justify-between h-full">
                  
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-100">
                          {item.cabin} • Grade {item.grade}
                        </span>
                        <h2 className="font-display font-black text-2xl text-stone-900 mt-1">{item.camper}</h2>
                      </div>
                      {isDone ? (
                        <span className="eyebrow-pill bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Dispensed
                        </span>
                      ) : (
                        <span className="eyebrow-pill bg-amber-100 text-amber-800 border border-amber-200">
                          Scheduled ({item.time})
                        </span>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                      <div className="flex items-center gap-2 font-extrabold text-sm text-stone-900">
                        <Pill className="w-4 h-4 text-forest-800" />
                        <span>{item.medication}</span>
                        <span className="font-mono text-xs font-normal text-stone-500">({item.dosage})</span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{item.instructions}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-alert-red-bg border border-alert-red-border text-xs text-alert-red flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{item.allergyAlert}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDispense(item.id)}
                    disabled={isDone}
                    className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isDone
                        ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                        : "bg-forest-800 hover:bg-forest-900 text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isDone ? "Recorded in Supabase by Nurse" : "Sign Off & Dispense Dose"}</span>
                  </button>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}

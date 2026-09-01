"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Shield,
  User,
  ArrowRight,
  Sparkles,
  Camera,
  Check
} from "lucide-react";

export default function ExpressCheckinPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCamper, setSelectedCamper] = useState<{
    id: string;
    name: string;
    cabin: string;
    counselor: string;
    medClearance: boolean;
    allergies: string;
    checkedIn: boolean;
    canteenBalance: string;
  } | null>({
    id: "reg-1",
    name: "Jamie Gallic",
    cabin: "Cabin 4 • Timber Lodge",
    counselor: "Counselor Mark & Sarah",
    medClearance: true,
    allergies: "Peanut / Nut Allergy (EpiPen Logged in eMAR)",
    checkedIn: false,
    canteenBalance: "$35.00"
  });

  const [checkinSuccess, setCheckinSuccess] = useState(false);

  const handleCheckin = () => {
    if (selectedCamper) {
      setSelectedCamper({ ...selectedCamper, checkedIn: true });
      setCheckinSuccess(true);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full uppercase">
            OPENING DAY SUNDAY DROP-OFF
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900 mt-2">
            Express Gate Check-In Scanner
          </h1>
        </div>
        <Link href="/admin" className="px-4 py-2 rounded-full bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200 w-max">
          ← Back to Director Hub
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-stone-200 shadow-md space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Scan Parent Boarding Pass QR or type camper last name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-stone-300 text-stone-900 text-base font-bold focus:border-forest-800 focus:outline-none"
          />
        </div>
      </div>

      {selectedCamper && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 border-2 border-stone-300 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">CAMPER PROFILE</span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-stone-900">{selectedCamper.name}</h2>
            </div>
            
            {selectedCamper.checkedIn ? (
              <span className="px-5 py-2.5 rounded-full bg-emerald-100 text-emerald-950 font-black text-xs sm:text-sm border-2 border-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>CHECKED IN AT GATE</span>
              </span>
            ) : (
              <span className="px-5 py-2.5 rounded-full bg-amber-100 text-amber-950 font-black text-xs sm:text-sm border-2 border-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Awaiting Arrival</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 space-y-1">
              <span className="font-mono text-[10px] font-bold text-forest-800 uppercase block">ASSIGNED CABIN</span>
              <b className="text-base font-black text-forest-950 block">{selectedCamper.cabin}</b>
              <span className="text-xs text-forest-800 block">{selectedCamper.counselor}</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="font-mono text-[10px] font-bold text-emerald-800 uppercase block">HEALTH LODGE STATUS</span>
              <b className="text-base font-black text-emerald-950 block">Cleared by RN</b>
              <span className="text-xs text-emerald-800 block">{selectedCamper.allergies}</span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
              <span className="font-mono text-[10px] font-bold text-purple-800 uppercase block">CANTEEN WRISTBAND</span>
              <b className="text-base font-black text-purple-950 block">{selectedCamper.canteenBalance} Loaded</b>
              <span className="text-xs text-purple-800 block">Issue Green Wristband #402</span>
            </div>
          </div>

          {!selectedCamper.checkedIn ? (
            <button
              type="button"
              onClick={handleCheckin}
              className="w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl cursor-pointer active:scale-98 transition-transform"
            >
              <Check className="w-6 h-6 stroke-[3]" />
              <span>Confirm 45-Second Gate Check-In & Issue Wristband</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 font-bold text-center text-sm">
              ✓ Jamie Gallic has been checked in. Counselor Mark & Sarah notified at Cabin 4.
            </div>
          )}
        </div>
      )}
    </main>
  );
}

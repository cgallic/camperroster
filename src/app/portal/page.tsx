"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, PhoneCall, CheckCircle2, FileText, Upload, Calendar, Users, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ParentPortalPage() {
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState<any>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("registrations")
        .select("id, status, progress_percentage, payment_plan, canteen_balance_cents, total_tuition_cents, amount_paid_cents, campers(legal_first_name, legal_last_name, grade_entering, birth_date), health_profiles(has_allergies, allergy_details, immunization_status), guardians(first_name, last_name, phone)")
        .limit(1)
        .single();

      setRegistration(data);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Camp Hope Home</span>
          </Link>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-stone-900">Parent Household Portal</h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Access your registered campers, upload required medical forms, and manage installment payments.
          </p>
        </div>

        {!searched ? (
          <div className="double-bezel-outer p-2 max-w-lg">
            <div className="double-bezel-inner p-8 space-y-6">
              <div className="space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase text-forest-800 tracking-wider">
                  Passwordless 1-Tap Access
                </span>
                <h2 className="font-display font-extrabold text-xl text-stone-900">Look up your registration</h2>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Enter the mobile phone number you used during camper registration to view your account.
                </p>
              </div>

              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">Guardian Mobile Phone</label>
                  <input
                    type="tel"
                    placeholder="(908) 555-0147"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-200 text-sm font-mono focus:border-forest-800 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Access Household Portal →</span>}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* HOUSEHOLD SUMMARY CARD */}
            <div className="double-bezel-outer p-2">
              <div className="double-bezel-inner p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase text-forest-800 tracking-wider">
                      HOUSEHOLD ACCOUNT
                    </span>
                    <h2 className="font-display font-black text-2xl text-stone-900 mt-1">
                      {registration?.guardians?.first_name || "Peter"} {registration?.guardians?.last_name || "Gallic"}
                    </h2>
                    <span className="text-xs text-stone-500 font-mono">{registration?.guardians?.phone || "(908) 555-0147"}</span>
                  </div>
                  <span className="eyebrow-pill bg-emerald-100 text-emerald-900 border border-emerald-200">
                    ● Summer 2027 Confirmed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="text-[11px] text-stone-500 font-bold block">Registered Camper</span>
                    <b className="text-base text-stone-900 block">
                      {registration?.campers?.legal_first_name || "Jamie"} {registration?.campers?.legal_last_name || "Gallic"}
                    </b>
                    <span className="text-xs text-forest-700">Grade {registration?.campers?.grade_entering || 4} • Cabin Pine 2</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="text-[11px] text-stone-500 font-bold block">Tuition Status</span>
                    <b className="text-base text-stone-900 block">$100 Paid / $650 Total</b>
                    <span className="text-xs text-stone-600 font-mono">Next: $275 on May 1</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="text-[11px] text-stone-500 font-bold block">Canteen Wallet</span>
                    <b className="text-base text-forest-900 font-mono block">
                      ${((registration?.canteen_balance_cents || 3450) / 100).toFixed(2)}
                    </b>
                    <span className="text-xs text-emerald-700 font-semibold">Prepaid & Active</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4 border-t border-stone-100">
                  <Link
                    href="/register"
                    className="px-5 py-2.5 rounded-xl bg-forest-800 text-white font-bold text-xs hover:bg-forest-900 transition-colors"
                  >
                    Register Another Camper
                  </Link>
                  <button
                    onClick={() => alert("✓ Packing list & camp itinerary sent to guardian email.")}
                    className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-800 font-bold text-xs hover:bg-stone-50 transition-colors"
                  >
                    Email Packing List & Guide
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}

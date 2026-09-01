"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ChevronDown
} from "lucide-react";

export default function SeoLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
  {
    "q": "Is CamperRoster HIPAA and ACA compliant for camp medical records?",
    "a": "Yes. Medical records are encrypted with PostgreSQL Row-Level Security, ensuring that only authenticated Health Lodge medical staff have access to confidential health files."
  },
  {
    "q": "How much do we save by replacing CampDoc?",
    "a": "A camp with 400 campers saves $2,400 to $4,800 annually by eliminating the separate CampDoc per-camper fee and double subscription."
  }
];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-4 max-w-4xl mx-auto">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>THE NATIVE CAMPDOC ALTERNATIVE</span>
        </span>
        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-stone-950 tracking-tight leading-tight">
          Built-in Health Lodge eMAR. Zero Parent Upsells. Zero Double Logins.
        </h1>
        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-2xl mx-auto leading-relaxed">
          CampDoc charges $6–$12 per camper, forces parents to create a second account, and pushes travel insurance ads. CamperRoster includes native ACA & HIPAA eMAR built directly into your registration.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/start"
            className="px-8 py-4 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
          >
            <span>Launch Your Camp ($0 Setup)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-sm flex items-center justify-center"
          >
            <span>Calculate Your Savings →</span>
          </Link>
        </div>
      </section>

      {/* 2. THE CORE CHALLENGES (PAIN POINTS) */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="font-mono text-xs font-bold uppercase text-rose-800 tracking-wider">THE OLD WAY</span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-stone-950">Why Camps Are Making the Switch</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1">
        <b className="font-bold text-rose-900 block">Double Login Friction</b>
        <p className="text-xs text-stone-600">Parents must remember two separate passwords: one for registration and one for CampDoc.</p>
      </div>
      <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1">
        <b className="font-bold text-rose-900 block">Aggressive Product Upsells</b>
        <p className="text-xs text-stone-600">CampDoc pushes travel insurance and luggage tags during medical checkout, irritating parents.</p>
      </div>
      <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1">
        <b className="font-bold text-rose-900 block">$6–$12 Extra Per Camper</b>
        <p className="text-xs text-stone-600">An additional $2,000–$5,000 software fee on top of your existing registration system.</p>
      </div>
        </div>
      </section>

      {/* 3. COMPARISON MATRIX */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 tracking-wider">SIDE-BY-SIDE BREAKDOWN</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">CampDoc vs CamperRoster</h2>
        </div>
        <div className="overflow-x-auto border-2 border-stone-200 rounded-2xl bg-white shadow-md">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200">
              <tr>
                <th className="p-4">Feature / Requirement</th>
                <th className="p-4 text-stone-600">Legacy Systems</th>
                <th className="p-4 bg-emerald-50 text-emerald-950 font-black">CamperRoster Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr>
        <td className="p-4 font-bold">Medical System Integration</td>
        <td className="p-4 text-rose-700 font-bold">Separate Siloed System</td>
        <td className="p-4 bg-emerald-50/50 text-emerald-900 font-black">100% Native Unified Platform</td>
      </tr>
      <tr>
        <td className="p-4 font-bold">Parent Logins Required</td>
        <td className="p-4 text-rose-700 font-bold">2 Separate Accounts</td>
        <td className="p-4 bg-emerald-50/50 text-emerald-900 font-black">1-Tap SMS Magic Links (Zero Passwords)</td>
      </tr>
      <tr>
        <td className="p-4 font-bold">Parent Checkout Upsells</td>
        <td className="p-4 text-rose-700 font-bold">Aggressive Insurance Ads</td>
        <td className="p-4 bg-emerald-50/50 text-emerald-900 font-black">100% Ad-Free & Clean</td>
      </tr>
      <tr>
        <td className="p-4 font-bold">Electronic eMAR Tablet Dispenser</td>
        <td className="p-4 text-stone-700">Add-on module</td>
        <td className="p-4 bg-emerald-50/50 text-emerald-900 font-black">Included Standard for Camp Nurses</td>
      </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. KEY CAPABILITIES (BENEFITS) */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="font-mono text-xs font-bold uppercase text-forest-800 tracking-wider">MODERN CAMP OS</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">Engineered for Summer Camp Directors</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-black text-stone-900 block">💊 Health Lodge Nurse Tablet eMAR</b>
        <p className="text-xs sm:text-sm text-stone-600">Schedule and log Breakfast, Lunch, Dinner, and Bedtime doses with timestamped records compliant with ACA and HIPAA.</p>
      </div>
      <div className="p-5 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-black text-stone-900 block">📷 Mobile Insurance Card Capture</b>
        <p className="text-xs sm:text-sm text-stone-600">Parents snap photos of their insurance cards and immunization forms directly from their phone camera.</p>
      </div>
        </div>
      </section>

      {/* 5. FAQ ACCORDION */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-1">
          <span className="font-mono text-xs font-bold uppercase text-stone-500 tracking-wider">FAQ</span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-stone-950">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden shadow-xs">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 text-left font-black text-sm sm:text-base text-stone-900 flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-stone-500 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
              </button>
              {openFaq === idx && (
                <div className="p-5 pt-0 text-xs sm:text-sm text-stone-600 font-medium leading-relaxed border-t border-stone-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. BOTTOM CTA */}
      <section className="bg-forest-950 text-white rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-2xl border-2 border-emerald-400">
        <span className="eyebrow-pill bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
          $0 SETUP • $0 WINTER RETAINERS
        </span>
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white">
          Eliminate CampDoc fees with unified medical eMAR.
        </h2>
        <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
          Give parents one clean portal and give your camp nurse a dedicated tablet dosage tracker.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/start"
            className="px-10 py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-sm shadow-xl active:scale-98 transition-transform"
          >
            Launch Your Camp Portal ($0 Setup) →
          </Link>
        </div>
      </section>

    </main>
  );
}

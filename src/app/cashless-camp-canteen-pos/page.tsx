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
    "q": "Can parents set daily snack limits on the digital canteen wallet?",
    "a": "Yes! Directors and parents can configure daily spending maximums (e.g. $6.00/day for candy and soda) to ensure healthy balance throughout the week."
  },
  {
    "q": "What hardware is required for the Canteen POS?",
    "a": "CamperRoster's Canteen POS runs in any modern browser on an iPad, tablet, phone, or laptop. No proprietary card reader required."
  }
];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-4 max-w-4xl mx-auto">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>CASHLESS CAMP STORE • DIGITAL WRISTBANDS</span>
        </span>
        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-stone-950 tracking-tight leading-tight">
          Digital Wristband Store Register & Online Parent Wallet Reloads.
        </h1>
        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-2xl mx-auto leading-relaxed">
          Eliminate lost cash, paper camp bank ledgers, and register lines. Campers scan their wristband at the snack shack; parents reload balances online from the portal.
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
        <b className="font-bold text-rose-900 block">Lost Cash at the Lake</b>
        <p className="text-xs text-stone-600">Campers dropping physical cash out of pockets during lake kayaking or cabin games.</p>
      </div>
      <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1">
        <b className="font-bold text-rose-900 block">Manual Paper Bank Ledgers</b>
        <p className="text-xs text-stone-600">Staff spending hours every night balancing paper canteen tally sheets and envelopes.</p>
      </div>
      <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1">
        <b className="font-bold text-rose-900 block">Snack Over-Spending</b>
        <p className="text-xs text-stone-600">Campers blowing their entire week's budget on soda and candy on Day 1.</p>
      </div>
        </div>
      </section>

      {/* 3. COMPARISON MATRIX */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 tracking-wider">SIDE-BY-SIDE BREAKDOWN</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">Cashless Camp Canteen POS vs CamperRoster</h2>
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
        <td className="p-4 font-bold">Camp Store Payment Method</td>
        <td className="p-4 text-rose-700 font-bold">Physical Cash or Paper Tally</td>
        <td className="p-4 bg-emerald-50/50 text-emerald-900 font-black">Digital Barcode / Wristband Scan</td>
      </tr>
      <tr>
        <td className="p-4 font-bold">Online Parent Wallet Reloads</td>
        <td className="p-4 text-stone-600">Not Available or Check at Drop-off</td>
        <td className="p-4 bg-emerald-50/50 text-emerald-900 font-black">1-Tap Portal Reloads (+$10, +$25, +$50)</td>
      </tr>
      <tr>
        <td className="p-4 font-bold">Daily Spending Limits</td>
        <td className="p-4 text-stone-600">Manual Cashier Tracking</td>
        <td className="p-4 bg-emerald-50/50 text-emerald-900 font-black">Automatic Daily Spend Rules (e.g. $6/day)</td>
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
        <b className="font-black text-stone-900 block">💳 1-Tap Canteen POS Register</b>
        <p className="text-xs sm:text-sm text-stone-600">Fast barcode scanning or camper lookup on tablets and phones. Zero cash handling for teenage staff.</p>
      </div>
      <div className="p-5 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-black text-stone-900 block">💰 Automated End-of-Week Refunds or Donations</b>
        <p className="text-xs sm:text-sm text-stone-600">Parents can choose to refund remaining balances or donate unspent funds to the camp scholarship fund.</p>
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
          Upgrade your camp store to cashless wristbands.
        </h2>
        <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
          Eliminate cash handling, speed up canteen lines, and give parents complete transparency.
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

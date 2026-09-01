"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  DollarSign,
  Users,
  PhoneCall,
  Tablet,
  QrCode,
  FileSpreadsheet,
  Clock,
  Zap,
  Lock,
  HeartHandshake
} from "lucide-react";

export default function DeepSeoLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
  {
    "q": "What hardware is required to run the CamperRoster Canteen POS?",
    "a": "No proprietary hardware or special credit card terminals are required. The Canteen POS runs in any modern browser on an iPad, tablet, smartphone, or laptop."
  },
  {
    "q": "Can parents set dietary or spending restrictions in the store?",
    "a": "Yes! Dietary warnings (e.g. Peanut Allergy, Gluten-Free) appear prominently on the register screen when a camper is scanned."
  },
  {
    "q": "How do parents reload canteen funds during camp week?",
    "a": "Parents open their Parent Household Portal (/portal), click the Canteen Store Wallet tab, and tap +$10, +$25, or +$50. Funds are available instantly at the snack shack."
  },
  {
    "q": "What happens to leftover money on Friday at check-out?",
    "a": "Camp directors can automatically refund remaining balances back to parents' original payment methods or allow parents to donate unspent balances to camp ministry."
  }
];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>CASHLESS CAMP STORE • DIGITAL WRISTBANDS</span>
        </span>
        
        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-stone-950 tracking-tight leading-[1.1]">
          Digital Wristband Store Register & Online Parent Wallet Reloads.
        </h1>
        
        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-3xl mx-auto leading-relaxed">
          Eliminate lost cash, paper camp bank ledgers, and register lines. Campers scan their wristband at the snack shack; parents reload balances online from the portal.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3.5">
          <Link
            href="/start"
            className="px-8 py-4 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-98 transition-transform w-full sm:w-auto"
          >
            <span>Launch Your Camp ($0 Setup)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-sm flex items-center justify-center w-full sm:w-auto"
          >
            <span>Calculate Your Exact Savings →</span>
          </Link>
        </div>

        <div className="pt-4 flex flex-wrap justify-center items-center gap-6 text-xs font-bold text-stone-500">
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>1-Tap Digital Wristband POS</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Instant Online Parent Wallet Reloads</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Daily Spend Rules & Snack Limits</span>
          </span>
        </div>
      </section>

      {/* 2. THE 4 CORE PAIN POINTS OF THE OLD WAY */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-12 border border-stone-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-rose-800 tracking-wider">THE OLD WAY</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            The Headache of Cash & Paper Canteen Ledgers
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Managing physical cash at summer camp is inefficient, error-prone, and frustrating for parents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">1</div>
          <h3 className="font-display font-black text-lg text-stone-950">Lost Cash at the Lake and Cabins</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Campers losing dollar bills from their swim trunks or cabin bunks during active outdoor recreation.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">2</div>
          <h3 className="font-display font-black text-lg text-stone-950">Hours of Nightly Paper Ledger Reconciliation</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Camp staff spending 2 hours every night counting physical bills and manually tallying paper snack shack index cards.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">3</div>
          <h3 className="font-display font-black text-lg text-stone-950">Day 1 Budget Blowouts by Campers</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Campers spending their entire $30 weekly allowance on candy and soda on Monday, leaving nothing for Friday camp hoodies.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">4</div>
          <h3 className="font-display font-black text-lg text-stone-950">Slow Opening Day Canteen Drop-Off Tables</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Parents waiting in a separate 15-minute line on Sunday to write paper checks or hand cash envelopes to the camp banker.
        </p>
      </div>
        </div>
      </section>

      {/* 3. DEEP COMPARISON MATRIX */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 tracking-wider">SIDE-BY-SIDE EVALUATION</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Paper Camp Bank vs CamperRoster Cashless POS
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Modern digital store management for iPads, phones, and tablets.
          </p>
        </div>

        <div className="overflow-x-auto border-2 border-stone-200 rounded-3xl bg-white shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-900 font-black border-b-2 border-stone-200">
              <tr>
                <th className="p-4 sm:p-5">Feature & Operational Dimension</th>
                <th className="p-4 sm:p-5 text-stone-600">Paper Cash & Ledgers</th>
                <th className="p-4 sm:p-5 bg-emerald-50 text-emerald-950 font-black">CamperRoster Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr>
        <td className="p-4 sm:p-5 font-bold">Camper Payment Method</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">Physical Cash or Paper Cards</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Digital Wristband Scan / Camper Name Search</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Parent Wallet Reloads</td>
        <td className="p-4 sm:p-5 text-stone-600">Cash / Check at Sunday Drop-off Only</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">1-Tap Online Portal Reloads (+$10, +$25, +$50)</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Daily Spend Rules</td>
        <td className="p-4 sm:p-5 text-stone-600">Manual Cashier Memory (Frequent Errors)</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Automated Daily Limits (e.g. Max $6.00/day for snacks)</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Nightly Financial Balancing</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">2+ Hours Manual Counting</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Instant 1-Click Automated Daily Ledger</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">End-of-Week Unused Balances</td>
        <td className="p-4 sm:p-5 text-stone-600">Mailing Tiny Cash Envelopes Home</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">1-Click Automated Refund or Scholarship Donation</td>
      </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. THE 4 PILLARS OF MODERN CAMP OPERATIONS */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-forest-800 tracking-wider">ALL-IN-ONE ARCHITECTURE</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            How CamperRoster Cashless Canteen POS Operates
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Runs in any web browser on iPads, tablets, and smartphones.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">📱 1-Tap Canteen POS Register</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Fast camper lookup by name, cabin, or barcode wristband scan. Teenage canteen staff can ring up transactions in under 5 seconds.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">💳 Parent Household Portal Reloads</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Parents check remaining canteen balances from their phones and add funds instantly without calling the camp office.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">🍫 Daily Snack & Merchandise Limits</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Configure rules like &quot;Max 2 snacks per day&quot; or &quot;Max $5.00 daily spend&quot; to prevent Monday budget blowouts.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">🎁 1-Click Scholarship Fund Donations</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Parents can opt-in to donate unspent balances ($3.50, $8.00) directly to the camp scholarship fund at the end of the week.
        </p>
      </div>
        </div>
      </section>

      {/* 5. 3-STEP ADOPTION / MIGRATION BLUEPRINT */}
      <section className="bg-white rounded-3xl p-6 sm:p-12 border-2 border-stone-300 shadow-xl space-y-8">
        <div className="max-w-3xl space-y-2">
          <span className="eyebrow-pill bg-emerald-100 text-emerald-950 border border-emerald-300">
            RAPID ONBOARDING
          </span>
          <h3 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            How to Get Started in 3 Simple Steps
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Zero setup fees, zero mandatory sales pitches. Get your camp registration portal live in under 3 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 1</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Create Your Camp Portal</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Enter your camp name, set your session dates and grade tiers at /start. Your custom portal URL (/c/[slug]) is generated instantly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 2</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Import Past Rosters (Optional)</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Upload past CSV spreadsheets or UltraCamp exports into the 1-Click Importer. All family and medical profiles map in 60 seconds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 3</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Accept Registrations & Payments</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Share your mobile-friendly registration link with parents. Accept $100 deposits, installment schedules, and medical uploads with $0 off-season fees.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-4">
          <Link href="/start" className="btn-primary-agency text-xs sm:text-sm py-4 px-8">
            <Sparkles className="w-4 h-4" />
            <span>Launch Your Camp ($0 Setup)</span>
          </Link>
          <Link href="/pricing" className="px-6 py-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm text-center">
            Calculate Your Camp's Savings →
          </Link>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-stone-500 tracking-wider">FAQ</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden shadow-xs"
            >
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

      {/* 7. BOTTOM CTA */}
      <section className="bg-forest-950 text-white rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-2xl border-2 border-emerald-400">
        <span className="eyebrow-pill bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
          READY FOR MODERN CAMP MANAGEMENT?
        </span>
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white">
          Launch your camp portal in 3 minutes.
        </h2>
        <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
          $0 setup, $0 off-season retainers, and free 1-click roster migration. Join the modern standard for summer camp operations.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/start"
            className="px-10 py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-sm shadow-xl active:scale-98 transition-transform"
          >
            Create Camp Portal ($0 Setup) →
          </Link>
        </div>
      </section>

    </main>
  );
}

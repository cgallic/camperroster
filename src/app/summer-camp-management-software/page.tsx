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
    "q": "What size summer camps is CamperRoster designed for?",
    "a": "CamperRoster is built for residential, day, and faith-based summer camps ranging from 100 to 2,500+ campers per season."
  },
  {
    "q": "How does the $0 off-season model work?",
    "a": "You pay $0/month during your 7 to 9 off-season months. You only pay a flat $4 to $6 per registered camper during active registration seasons."
  },
  {
    "q": "Can we import our past rosters from spreadsheets or UltraCamp?",
    "a": "Yes! Drop your CSV export into our 1-Click Importer (/admin/import) to auto-map all historical records in 60 seconds."
  },
  {
    "q": "How fast can our camp go live on CamperRoster?",
    "a": "You can launch your custom branded camp portal in under 3 minutes at /start with zero onboarding fees."
  }
];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>THE NEXT-GEN CAMP OPERATING SYSTEM</span>
        </span>
        
        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-stone-950 tracking-tight leading-[1.1]">
          Modern Registration, Health Lodge eMAR, and Operations for Summer Camps.
        </h1>
        
        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-3xl mx-auto leading-relaxed">
          Join residential and day camps across North America using CamperRoster to eliminate paper forms, automate staff hiring, and cut off-season software fees to $0.
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
            <span>$0 Off-Season Monthly Retainer</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>KaiCalls Automated Voice AI References</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Health Lodge Tablet eMAR & 45-Sec Gate QR</span>
          </span>
        </div>
      </section>

      {/* 2. THE 4 CORE PAIN POINTS OF THE OLD WAY */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-12 border border-stone-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-rose-800 tracking-wider">THE OLD WAY</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Why Legacy Camp Software Systems Fail Summer Camps
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Camps waste thousands of dollars every year juggling 4 to 5 separate software subscriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">1</div>
          <h3 className="font-display font-black text-lg text-stone-950">Fragmented Software Subscriptions</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Paying for separate tools: UltraCamp for registration, CampDoc for medical records, Bunk1 for parent mail, and Square for canteen snacks.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">2</div>
          <h3 className="font-display font-black text-lg text-stone-950">High Parent Drop-Off on Mobile Safari</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Legacy forms built for 2005 desktop browsers trigger zoom bugs and multi-page confusion, causing 25%+ of parents to abandon registration.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">3</div>
          <h3 className="font-display font-black text-lg text-stone-950">Opening Sunday Traffic Jams</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Parents waiting 30 minutes in line in the summer heat while staff shuffle through paper clipboards and medical binders.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">4</div>
          <h3 className="font-display font-black text-lg text-stone-950">Unforgiving Winter Software Retainers</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Paying $400–$900 every month in winter when zero registrations are taking place drains non-profit camp reserves.
        </p>
      </div>
        </div>
      </section>

      {/* 3. DEEP COMPARISON MATRIX */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 tracking-wider">SIDE-BY-SIDE EVALUATION</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Legacy Software vs CamperRoster Modern Camp OS
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            All 6 core operational functions unified into one seamless platform.
          </p>
        </div>

        <div className="overflow-x-auto border-2 border-stone-200 rounded-3xl bg-white shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-900 font-black border-b-2 border-stone-200">
              <tr>
                <th className="p-4 sm:p-5">Feature & Operational Dimension</th>
                <th className="p-4 sm:p-5 text-stone-600">Fragmented Legacy Tools</th>
                <th className="p-4 sm:p-5 bg-emerald-50 text-emerald-950 font-black">CamperRoster Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr>
        <td className="p-4 sm:p-5 font-bold">Annual Software Overhead</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">$6,000 – $12,000 / year across 4 tools</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">$0 Retainer + Flat $4–$6/camper (Save $6k+)</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Mobile Registration UX</td>
        <td className="p-4 sm:p-5 text-stone-600">Desktop-Oriented (iOS Zoom Bugs)</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">5-Step Mobile-First Wizard with 16px Inputs</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Staff Reference Verification</td>
        <td className="p-4 sm:p-5 text-stone-600">Manual Staff Calling (40+ hours)</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Automated 2-Min KaiCalls Voice AI (Audio + Transcript)</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Health Lodge eMAR Dispenser</td>
        <td className="p-4 sm:p-5 text-stone-600">Requires Expensive Separate CampDoc Sub</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Built-in Tablet eMAR (ACA & HIPAA Compliant)</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Opening-Day Gate Drop-Off</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">Paper Rosters (30-min delays)</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">45-Second Mobile QR Scanner with RN Medical Clearance</td>
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
            The 4 Core Operational Engines
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Built to serve Directors, Camp Nurses, Cabin Counselors, and Parents.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">📱 5-Step Mobile Registration Wizard</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          16px inputs prevent mobile Safari zoom. Camera insurance card photo capture and multi-camper sibling discounts built-in.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">💊 Health Lodge Tablet eMAR</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Tablet medication dispenser for camp nurses. Schedule and log doses with timestamped records compliant with ACA and HIPAA.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">⚡ 45-Second Express Gate QR Check-In</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Eliminate Sunday vehicle drop-off traffic. Parents show digital boarding pass; gate staff scan to confirm RN clearance.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">🛒 Cashless Canteen Store POS</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Campers buy snacks with digital wristbands. Parents reload balances online from the portal with zero cash lost in the lake.
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

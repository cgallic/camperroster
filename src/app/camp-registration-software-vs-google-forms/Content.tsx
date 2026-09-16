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
    "q": "How does CamperRoster pricing compare to free Google Forms?",
    "a": "While Google Forms has no software fee, it costs directors 100+ hours in manual payment reconciliation and risk. CamperRoster charges $0 in the off-season and a flat $4 to $6 per registered camper, which can be passed through in the registration fee."
  },
  {
    "q": "Can we import our existing Google Forms spreadsheet into CamperRoster?",
    "a": "Yes! Download your Google Form response spreadsheet as a CSV and upload it to our 1-Click Importer (/admin/import) to transfer all records in under 60 seconds."
  },
  {
    "q": "How do parents pay if we switch from Venmo?",
    "a": "Parents can securely pay via credit card or ACH direct bank transfer with instant automated receipts and automated installment schedules."
  },
  {
    "q": "Is CamperRoster easy for non-technical camp staff to use?",
    "a": "Yes! CamperRoster is designed to be as simple as consumer mobile apps with zero technical setup required."
  }
];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>SOFTWARE VS SPREADSHEETS</span>
        </span>
        
        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-stone-950 tracking-tight leading-[1.1]">
          Why 35% of Growing Camps Are Moving from Google Forms & Venmo to CamperRoster.
        </h1>
        
        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-3xl mx-auto leading-relaxed">
          Google Forms creates hours of manual payment reconciliation, compliance risks for medical data, and chaotic Sunday check-in. CamperRoster automates registration, waivers, and health eMAR.
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
            <span>Automated Stripe & ACH Installment Schedules</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>HIPAA & ACA Compliant Medical Encryption</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>45-Second Express Gate Drop-Off</span>
          </span>
        </div>
      </section>

      {/* 2. THE 4 CORE PAIN POINTS OF THE OLD WAY */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-12 border border-stone-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-rose-800 tracking-wider">THE OLD WAY</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            The Hidden Costs of 'Free' Google Forms & Venmo
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            What looks free upfront costs camp directors 100+ hours in manual administrative labor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">1</div>
          <h3 className="font-display font-black text-lg text-stone-950">Manual Venmo & Check Payment Matching</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Directors spending dozens of hours cross-referencing Venmo handles and un-notated bank deposits against spreadsheet rows.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">2</div>
          <h3 className="font-display font-black text-lg text-stone-950">Severe HIPAA & Medical Privacy Liability</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Storing sensitive child medical histories, EpiPen plans, and insurance cards in shared Google Sheets violates standard privacy rules.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">3</div>
          <h3 className="font-display font-black text-lg text-stone-950">No Capacity Limits (Accidental Over-Booking)</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Google Forms doesn't automatically close sessions when cabin beds fill, leading to awkward phone calls turning families away.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">4</div>
          <h3 className="font-display font-black text-lg text-stone-950">Chaotic Sunday Gate Drop-Off Lines</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Staff printing 50-page spreadsheets and manually flipping pages to confirm check-in while vehicles back up on the road.
        </p>
      </div>
        </div>
      </section>

      {/* 3. DEEP COMPARISON MATRIX */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 tracking-wider">SIDE-BY-SIDE EVALUATION</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Google Forms vs CamperRoster Comparison
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Why purpose-built camp management software pays for itself in week one.
          </p>
        </div>

        <div className="overflow-x-auto border-2 border-stone-200 rounded-3xl bg-white shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-900 font-black border-b-2 border-stone-200">
              <tr>
                <th className="p-4 sm:p-5">Feature & Operational Dimension</th>
                <th className="p-4 sm:p-5 text-stone-600">Google Forms & Venmo</th>
                <th className="p-4 sm:p-5 bg-emerald-50 text-emerald-950 font-black">CamperRoster Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr>
        <td className="p-4 sm:p-5 font-bold">Payment & Deposit Processing</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">Manual Venmo/Check Matching</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Automated Stripe & ACH Installment Schedules</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Medical Health Disclosures</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">Unencrypted Public Spreadsheets</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Encrypted PostgreSQL RLS (ACA & HIPAA Compliant)</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Cabin Capacity & Auto-Close</td>
        <td className="p-4 sm:p-5 text-stone-600">Manual (Over-Booking Risk)</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Automatic Session Caps & Waitlist Management</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Sunday Opening Gate Drop-Off</td>
        <td className="p-4 sm:p-5 text-stone-600">30-Min Paper Spreadsheet Lines</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">45-Second Mobile QR Scanner with RN Badges</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Staff Volunteer Reference Checks</td>
        <td className="p-4 sm:p-5 text-stone-600">40+ Hours Manual Calling</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Automated 2-Min KaiCalls Voice AI Interviews</td>
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
            Why Switching from Google Forms Takes 60 Seconds
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Export your existing Google Sheet to CSV and import it into CamperRoster.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">📥 1-Click Google Sheet Importer</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Export your Google Form responses as a CSV and drop it into CamperRoster (/admin/import). All past records map automatically.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">💳 Automated Deposit Installments</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Parents pay $100 today and choose automated monthly schedules, eliminating manual payment chasing for camp directors.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">💊 Health Lodge Tablet eMAR</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Give your camp nurse a dedicated tablet dosage tracker compliant with ACA standards instead of paper medical binders.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">⚡ 45-Second Express Gate Drop-Off</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Scan mobile QR boarding passes on Sunday to eliminate vehicle traffic jams at the camp entrance.
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

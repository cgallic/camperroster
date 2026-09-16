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
    "q": "How does CamperRoster compare in price to CampBrain?",
    "a": "CampBrain charges $2,000\u2013$5,000 in upfront setup fees plus $3,000\u2013$8,000 in annual retainers. CamperRoster has $0 setup fees, $0 off-season retainers, and charges a simple $4 to $6 per registered camper, saving mid-sized camps over $5,000 every year."
  },
  {
    "q": "Can we import our existing CampBrain historical records?",
    "a": "Yes! Export your camper, guardian, and medical history from CampBrain to a CSV file and drop it into our 1-Click Importer (/admin/import). All data transfers in under 60 seconds with zero manual data entry."
  },
  {
    "q": "Does CamperRoster require multi-year contracts like CampBrain?",
    "a": "No. CamperRoster does not lock camps into restrictive multi-year contracts. You pay only when campers register."
  },
  {
    "q": "Is CamperRoster easy for seasonal college counselors to use?",
    "a": "Yes. The counselor cabin roster (/counselor) is built like a native smartphone app with 1-tap parent phone dialing and cabin attendance tracking that requires zero staff training."
  }
];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>THE #1 CAMPOBRAIN ALTERNATIVE</span>
        </span>
        
        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-stone-950 tracking-tight leading-[1.1]">
          Replace $5,000 Setup Fees with a Modern $0 Off-Season Camp OS.
        </h1>
        
        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-3xl mx-auto leading-relaxed">
          CampBrain is expensive, desktop-heavy, and requires weeks of seasonal staff training. CamperRoster is mobile-first, sets up in 3 minutes, and charges $0 in the winter.
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
            <span>$0 Setup & Onboarding Fees</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>$0 Off-Season Monthly Retainer</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>KaiCalls Voice AI Reference Calling</span>
          </span>
        </div>
      </section>

      {/* 2. THE 4 CORE PAIN POINTS OF THE OLD WAY */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-12 border border-stone-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-rose-800 tracking-wider">THE OLD WAY</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Why Camps Are Moving Away from CampBrain
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            CampBrain's legacy desktop architecture creates unnecessary financial and operational barriers for summer camps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">1</div>
          <h3 className="font-display font-black text-lg text-stone-950">$2,000–$5,000 Setup & Implementation Fees</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          CampBrain requires mandatory onboarding fees and extensive staff training contracts before you can accept your first camper registration.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">2</div>
          <h3 className="font-display font-black text-lg text-stone-950">Desktop-Heavy, Non-Mobile Interface</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Built for desktop office computers in 2008. Seasonal college counselors find it difficult to navigate on smartphones during active camp sessions.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">3</div>
          <h3 className="font-display font-black text-lg text-stone-950">Year-Round Monthly Retainer Bills</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Camps pay thousands in fixed software fees during the 8 off-season months when camper registrations are closed.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">4</div>
          <h3 className="font-display font-black text-lg text-stone-950">Zero Automated Voice Reference Checks</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Staff must manually call and chase dozens of pastoral and mentor references for volunteer staff during busy spring hiring.
        </p>
      </div>
        </div>
      </section>

      {/* 3. DEEP COMPARISON MATRIX */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 tracking-wider">SIDE-BY-SIDE EVALUATION</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            CampBrain vs CamperRoster Comparison
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Compare total cost of ownership, mobile responsiveness, and automation moats.
          </p>
        </div>

        <div className="overflow-x-auto border-2 border-stone-200 rounded-3xl bg-white shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-900 font-black border-b-2 border-stone-200">
              <tr>
                <th className="p-4 sm:p-5">Feature & Operational Dimension</th>
                <th className="p-4 sm:p-5 text-stone-600">CampBrain</th>
                <th className="p-4 sm:p-5 bg-emerald-50 text-emerald-950 font-black">CamperRoster Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr>
        <td className="p-4 sm:p-5 font-bold">Setup / Onboarding Fee</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">$2,000 – $5,000 Mandatory Setup</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">$0.00 (Self-Serve in Under 3 Minutes)</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Off-Season Monthly Retainer</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">$3,000 – $8,000 / year ($300+/mo)</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">$0.00 / month (Guaranteed $0 Off-Season)</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Volunteer Staff Reference Calling</td>
        <td className="p-4 sm:p-5 text-stone-600">Manual Staff Calling or Email Only</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Automated 2-Min KaiCalls Voice AI (Audio + Transcript)</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Health Lodge eMAR Tablet Dispenser</td>
        <td className="p-4 sm:p-5 text-stone-600">Additional Module Cost</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Included Native for Camp Nurses</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Opening-Day Gate Drop-Off</td>
        <td className="p-4 sm:p-5 text-stone-600">Manual Paper Rosters</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">45-Second Express QR Gate Scanner</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">1-Click CSV Roster Migration</td>
        <td className="p-4 sm:p-5 text-stone-600">Paid Implementation Required</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Instant 60-Second Auto-Mapper (/admin/import)</td>
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
            Engineered for Camp Directors & Seasonal Staff
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Modern software built to be intuitive on touchscreens without hours of mandatory training.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">📱 100% Touch-Optimized UX</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          16px form inputs prevent iOS zoom bugs. Parents can complete registrations on their phones in 5 minutes with zero password resets.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">🎙️ KaiCalls Voice AI Telephony</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Eliminate phone tag with references. KaiCalls calls pastors and mentors, records 2-minute character interviews, and scores risk.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">💊 Health Lodge Nurse Tablet eMAR</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Timestamped medication dispenser for nurses compliant with ACA and HIPAA guidelines, eliminating paper medical logs.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">⚡ 45-Second Express Gate Check-In</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Parents present their digital QR pass at the entrance gate; staff scan to confirm medical clearance and cabin placement in 45 seconds.
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

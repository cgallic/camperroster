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
    "q": "Is CamperRoster HIPAA and ACA compliant for camp health records?",
    "a": "Yes. Medical records are encrypted with PostgreSQL Row-Level Security, ensuring that only authenticated Health Lodge medical staff have access to confidential health files."
  },
  {
    "q": "How much does a camp save by replacing CampDoc?",
    "a": "A camp with 400 campers saves $2,400 to $4,800 annually by eliminating the separate CampDoc per-camper fee and double subscription."
  },
  {
    "q": "Can parents upload PDF physical forms and immunization cards?",
    "a": "Yes. Parents can upload PDFs or snap photos from their phone camera directly in the 5-step registration wizard."
  },
  {
    "q": "Does the Health Lodge eMAR work offline in rural camp areas?",
    "a": "Yes. CamperRoster's eMAR uses local offline caching, allowing nurses to log medication dispensing even if the health cabin loses Wi-Fi connection."
  }
];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>THE NATIVE CAMPDOC ALTERNATIVE</span>
        </span>
        
        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-stone-950 tracking-tight leading-[1.1]">
          Built-in Health Lodge eMAR. Zero Parent Upsells. Zero Double Logins.
        </h1>
        
        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-3xl mx-auto leading-relaxed">
          CampDoc charges $6–$12 per camper, forces parents to create a second account, and pushes travel insurance ads. CamperRoster includes native ACA & HIPAA eMAR built directly into your registration.
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
            <span>100% Ad-Free Parent Experience</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero Double Logins (1-Tap SMS Magic Links)</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Native ACA & HIPAA Health Lodge eMAR</span>
          </span>
        </div>
      </section>

      {/* 2. THE 4 CORE PAIN POINTS OF THE OLD WAY */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-12 border border-stone-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-rose-800 tracking-wider">THE OLD WAY</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            The Hidden Pains of Using Standalone CampDoc
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Siloed medical software adds extra costs, irritates parents with ads, and slows down camp staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">1</div>
          <h3 className="font-display font-black text-lg text-stone-950">Aggressive Product Upsells During Parent Checkout</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          CampDoc pushes travel insurance, luggage protection, and gear tags during medical checkout, creating a commercialized experience for families.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">2</div>
          <h3 className="font-display font-black text-lg text-stone-950">Double Login & Account Fatigue for Parents</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Parents must remember two separate accounts: one for registration and one for CampDoc, resulting in forgotten passwords and incomplete forms.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">3</div>
          <h3 className="font-display font-black text-lg text-stone-950">$6 to $12 Additional Fee Per Camper</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          An extra $2,400 to $4,800 added to your camp's budget on top of your primary registration software subscription.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">4</div>
          <h3 className="font-display font-black text-lg text-stone-950">Siloed Data Disconnected from Check-In</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Gate check-in staff cannot easily see real-time RN medical clearance without switching between separate software windows.
        </p>
      </div>
        </div>
      </section>

      {/* 3. DEEP COMPARISON MATRIX */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 tracking-wider">SIDE-BY-SIDE EVALUATION</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            CampDoc vs CamperRoster Comparison
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            See why all-in-one camp operations beats fragmented third-party medical add-ons.
          </p>
        </div>

        <div className="overflow-x-auto border-2 border-stone-200 rounded-3xl bg-white shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-900 font-black border-b-2 border-stone-200">
              <tr>
                <th className="p-4 sm:p-5">Feature & Operational Dimension</th>
                <th className="p-4 sm:p-5 text-stone-600">CampDoc</th>
                <th className="p-4 sm:p-5 bg-emerald-50 text-emerald-950 font-black">CamperRoster Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr>
        <td className="p-4 sm:p-5 font-bold">Platform Integration</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">Separate Siloed Add-on</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">100% Native All-in-One Camp OS</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Parent Checkout Ads / Upsells</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">Travel Insurance & Luggage Tag Ads</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">100% Ad-Free, Clean, and Mission-Focused</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Parent Login Requirements</td>
        <td className="p-4 sm:p-5 text-stone-600">Separate CampDoc Password Required</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">1-Tap SMS Magic Links (Zero Passwords)</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Per-Camper Additional Medical Fee</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">$6.00 – $12.00 / camper</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">$0.00 Extra (Included in Flat Camper Fee)</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Health Lodge Nurse Tablet eMAR</td>
        <td className="p-4 sm:p-5 text-stone-600">Requires CampDoc eMAR Add-on</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Included Native for Camp Health Lodge Staff</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Sunday Opening Gate Sync</td>
        <td className="p-4 sm:p-5 text-stone-600">Manual Spreadsheet Export Required</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Instant Live Sync on Gate QR Scanner</td>
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
            ACA & HIPAA Compliant Health Lodge Operations
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Built specifically for camp registered nurses, first aiders, and health directors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">💊 Tablet eMAR Medication Dispenser</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Camp nurses schedule and dispense medications by meal time (Breakfast, Lunch, Dinner, Bedtime) with timestamped audit logs.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">📷 Mobile Insurance Card Photo Capture</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Parents snap front/back photos of their insurance cards and immunization forms directly from their phone camera during registration.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">🔒 PostgreSQL Row-Level Security (RLS)</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Confidential medical histories, EpiPen care plans, and doctor notes are encrypted and isolated strictly to authorized health staff.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">⚡ Instant Gate RN Clearance Badges</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          When parents arrive on Sunday, gate staff scan their boarding pass QR to instantly confirm the nurse has cleared their health record.
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

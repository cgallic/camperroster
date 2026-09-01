"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

export default function UltraCampAlternativePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "Why do summer camps switch from UltraCamp to CamperRoster?",
      a: "Camps switch primarily to eliminate UltraCamp's off-season monthly retainer fees ($275 to $975/month from October to March), replace outdated non-responsive desktop forms with modern 16px mobile-first registration, automate staff reference phone calls via KaiCalls Voice AI, and eliminate 30-minute Sunday opening-day check-in traffic lines."
    },
    {
      q: "How does the CamperRoster $0 off-season pricing model compare to UltraCamp?",
      a: "UltraCamp charges camps year-round retainers regardless of whether registration is open. In contrast, CamperRoster charges $0/month during your 7 to 9 off-season months. Camps only pay a flat $4 to $6 per registered camper when parents actually register, saving the average 350-camper summer camp over $6,150 annually."
    },
    {
      q: "How does 1-click roster migration from UltraCamp work?",
      a: "Export your historical camper and household database from UltraCamp as a CSV file. Upload it to CamperRoster's 1-Click Importer (/admin/import). Our engine automatically maps parent contact details, camper dates of birth, allergy flags, immunization histories, and cabin preferences in under 60 seconds with zero manual data entry."
    },
    {
      q: "Does CamperRoster include health forms, or do we need CampDoc as well?",
      a: "CamperRoster includes a native, full-featured Health Lodge tablet eMAR system. Camp nurses schedule and log Breakfast, Lunch, Dinner, and Bedtime medications with timestamped records compliant with ACA and HIPAA standards. There is no need for a separate CampDoc subscription or double parent logins."
    },
    {
      q: "How does the KaiCalls automated volunteer reference check work?",
      a: "When a seasonal counselor or volunteer applies, KaiCalls Voice AI dials their pastor, employer, or professor. The AI conducts a friendly, structured 2-minute safety interview, records the call, and generates a timestamped audio recording and verified transcript with a safety score in your director dashboard."
    },
    {
      q: "How does Sunday opening-day gate check-in work?",
      a: "Parents receive an SVG boarding pass QR on their mobile phones. When their vehicle reaches the camp gate, staff scan the QR code with any smartphone or tablet. The scanner instantly verifies RN health clearance, displays the camper's assigned cabin and counselor, and dispenses canteen wristbands in under 45 seconds."
    },
    {
      q: "Can parents split payments or set up monthly installment schedules?",
      a: "Yes. Parents can pay an initial deposit (e.g. $100) and configure automated monthly installment plans via credit card or ACH bank transfer. CamperRoster automatically handles failed card retries and sends SMS receipts without director intervention."
    },
    {
      q: "Is our camp's medical and financial data secure?",
      a: "Yes. CamperRoster is built on Supabase PostgreSQL with strict Row-Level Security (RLS). Health disclosures and medical files are isolated exclusively to authenticated Health Lodge medical staff. Payments are processed via PCI-DSS Level 1 certified Stripe infrastructure."
    }
  ];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>THE MODERN ULTRACAMP ALTERNATIVE</span>
        </span>
        
        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-stone-950 tracking-tight leading-[1.1]">
          Stop paying the <span className="text-rose-700">"Winter Retainer Tax."</span> Upgrade to CamperRoster OS.
        </h1>
        
        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-3xl mx-auto leading-relaxed">
          UltraCamp bills camps $275–$975 every month during dead winter months while forcing parents through 15-year-old desktop forms. CamperRoster delivers modern 5-step mobile registration, automated KaiCalls Voice AI reference checking, and <b>$0/month in the off-season.</b>
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
            <span>Calculate Your Exact Savings vs UltraCamp →</span>
          </Link>
        </div>

        <div className="pt-4 flex flex-wrap justify-center items-center gap-6 text-xs font-bold text-stone-500">
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>$0 Off-Season Monthly Retainers</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>1-Click UltraCamp CSV Migration</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Automated KaiCalls Voice References</span>
          </span>
        </div>
      </section>

      {/* 2. THE 4 CORE PAIN POINTS OF ULTRACAMP */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-12 border border-stone-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-rose-800 tracking-wider">LEGACY SHORTCOMINGS</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Why Hundreds of Camp Directors Are Leaving UltraCamp
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            UltraCamp was built in the early 2000s desktop era. Today's parents register on iPhones, and today's directors cannot afford wasted winter software retainers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">1</div>
              <h3 className="font-display font-black text-lg text-stone-950">The $4,200 Off-Season Retainer Drain</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              UltraCamp forces camps into 12-month billing agreements ($350–$650/mo minimum), billing non-profit youth camps thousands of dollars between October and March when zero registrations take place.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">2</div>
              <h3 className="font-display font-black text-lg text-stone-950">High Parent Mobile Drop-Off Rates</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              UltraCamp's multi-step registration forms are not mobile-optimized. Small 12px form fields trigger auto-zoom bugs on Safari, leading to frustrated parents abandoning registration midway.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">3</div>
              <h3 className="font-display font-black text-lg text-stone-950">40+ Hours of Volunteer Reference Phone Tag</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              UltraCamp provides zero automated phone reference checking. Camp directors spend 40 to 60 hours every spring manually calling pastors and mentors to vet seasonal cabin counselors.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">4</div>
              <h3 className="font-display font-black text-lg text-stone-950">Chaotic Sunday Opening-Day Check-In</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Paper check-in sheets and missing immunization forms cause 30-minute vehicle traffic jams at the camp gate on opening Sunday.
            </p>
          </div>
        </div>
      </section>

      {/* 3. DEEP FEATURE-BY-FEATURE COMPARISON MATRIX */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 tracking-wider">COMPREHENSIVE TEARDOWN</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            UltraCamp vs CamperRoster Feature Comparison
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            See how CamperRoster replaces fragmented software subscriptions with a modern, all-in-one Camp OS.
          </p>
        </div>

        <div className="overflow-x-auto border-2 border-stone-200 rounded-3xl bg-white shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-900 font-black border-b-2 border-stone-200">
              <tr>
                <th className="p-4 sm:p-5">Feature & Operational Dimension</th>
                <th className="p-4 sm:p-5 text-stone-600">UltraCamp</th>
                <th className="p-4 sm:p-5 bg-emerald-50 text-emerald-950 font-black">CamperRoster Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr>
                <td className="p-4 sm:p-5 font-bold">Off-Season Monthly Retainer</td>
                <td className="p-4 sm:p-5 text-rose-700 font-bold">$275 – $975 / month ($3,300–$11,700/yr)</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">$0.00 / month (Guaranteed $0 Off-Season)</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Volunteer Staff Reference Checks</td>
                <td className="p-4 sm:p-5 text-stone-600">Manual Staff Calling (40+ hours)</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Automated 2-Min KaiCalls Voice AI (Audio + Transcript)</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Opening-Day Gate Drop-Off Check-In</td>
                <td className="p-4 sm:p-5 text-stone-600">Paper Clipboards (20–30 min delays)</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">45-Second Mobile QR Scanner with RN Medical Badge</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Health Lodge Medication Dispenser (eMAR)</td>
                <td className="p-4 sm:p-5 text-stone-600">Requires 3rd-Party Add-on (CampDoc $1,200+)</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Built-in Tablet eMAR (Breakfast, Lunch, Dinner, Bedtime)</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Parent Daily Bunk Notes Mail Call</td>
                <td className="p-4 sm:p-5 text-stone-600">Requires 3rd-Party Add-on (Bunk1 $800+)</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Native Daily Bunk Notes + 1-Click 11:00 AM Batch Printer</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Cashless Canteen Store POS</td>
                <td className="p-4 sm:p-5 text-stone-600">Requires Extra Proprietary Hardware</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Runs on Any iPad/Phone + 1-Tap Online Parent Reloads</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Parent Authentication UX</td>
                <td className="p-4 sm:p-5 text-stone-600">Forgotten Password Resets Required</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">1-Tap SMS Magic Links (Zero Passwords Needed)</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Historical Data Migration</td>
                <td className="p-4 sm:p-5 text-stone-600">Manual re-entry or paid onboarding</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">1-Click CSV Auto-Mapper in Under 60 Seconds</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. FINANCIAL CASE STUDY: CAMP HOPE 2027 */}
      <section className="bg-stone-950 text-white rounded-3xl p-6 sm:p-12 border-2 border-stone-800 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
          <div className="space-y-1">
            <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest">
              REAL-WORLD FINANCIAL AUDIT
            </span>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-white">
              How Camp Hope Slashes $6,150 in Annual Software Costs
            </h3>
          </div>
          <Link
            href="/c/camphope"
            className="px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs sm:text-sm shrink-0 flex items-center gap-1.5"
          >
            <span>Explore Camp Hope Demo Portal</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
            <span className="text-xs font-bold text-stone-400 block">UltraCamp + Add-ons Total</span>
            <b className="font-display font-black text-3xl text-rose-400 block">$8,250 / year</b>
            <p className="text-xs text-stone-400 leading-relaxed pt-1">
              $4,200 in winter retainers + $1,050 registration fees + $1,200 CampDoc + $800 Bunk1 + $1,000 staff reference calling labor.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
            <span className="text-xs font-bold text-stone-400 block">CamperRoster Pro All-Inclusive</span>
            <b className="font-display font-black text-3xl text-emerald-400 block">$2,100 / year</b>
            <p className="text-xs text-stone-400 leading-relaxed pt-1">
              $0 off-season retainers + flat $6/camper fee covering registration, medical eMAR, Bunk Notes, and KaiCalls Voice AI.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-2">
            <span className="text-xs font-bold text-emerald-300 block">Total Net Savings for Camp Hope</span>
            <b className="font-display font-black text-3xl text-emerald-400 block">SAVE $6,150 / YR</b>
            <p className="text-xs text-emerald-200/80 leading-relaxed pt-1">
              74% reduction in annual software overhead, freeing up critical budget for camp scholarships and facilities.
            </p>
          </div>
        </div>
      </section>

      {/* 5. 60-SECOND CSV MIGRATION BLUEPRINT */}
      <section className="bg-white rounded-3xl p-6 sm:p-12 border-2 border-stone-300 shadow-xl space-y-8">
        <div className="max-w-3xl space-y-2">
          <span className="eyebrow-pill bg-rose-100 text-rose-950 border border-rose-300">
            SEAMLESS DATA MIGRATION
          </span>
          <h3 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            How to Migrate from UltraCamp in 3 Simple Steps
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            You don't need expensive IT consultants or weeks of manual data entry. CamperRoster auto-maps your historical UltraCamp export in under a minute.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 1</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Export CSV from UltraCamp</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Navigate to UltraCamp's report builder and export your camper, guardian, and medical history into a standard CSV spreadsheet.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 2</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Upload to 1-Click Importer</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Drop your CSV file into CamperRoster's Importer (/admin/import). Our engine automatically detects and maps column headers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 3</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Launch Your Branded Portal</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Your camp portal is live with all historical family records intact. Send 1-tap SMS magic links to parents to register for Summer 2027.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-4">
          <Link href="/admin/import" className="btn-primary-agency text-xs sm:text-sm py-4 px-8">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Test 1-Click UltraCamp Importer</span>
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
            Frequently Asked Questions on Switching from UltraCamp
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
          READY TO UPGRADE YOUR CAMP?
        </span>
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white">
          Launch your camp portal in 3 minutes.
        </h2>
        <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
          $0 setup, $0 off-season retainers, and free 1-click roster migration from UltraCamp. Join the modern standard for camp management.
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

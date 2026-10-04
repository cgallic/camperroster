"use client";

import { useState } from "react";
import Link from "next/link";
import ProductShot from "@/components/ProductShot";
import FaqJsonLd from "@/components/FaqJsonLd";
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
    "q": "How are volunteer references handled today?",
    "a": "The volunteer application collects one reference's name, phone, and email. The camp director reviews it by hand, makes the call, and marks the reference approved in the director dashboard."
  },
  {
    "q": "What happens if a reference doesn't answer the phone call?",
    "a": "Camp staff decide how to follow up when a reference does not answer. CamperRoster does not place calls, leave voicemails, or send texts to references."
  },
  {
    "q": "Does CamperRoster record reference calls?",
    "a": "No. Calls are made by camp staff from their own phones, so there is no recording or transcript in CamperRoster. The reference details and the approval stay with the application."
  },
  {
    "q": "Is volunteer reference tracking included in CamperRoster's platform pricing?",
    "a": "Yes. Volunteer applications and reference review are included in the per-camper price at no extra charge."
  }
];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>VOLUNTEER APPLICATIONS • REFERENCE TRACKING</span>
        </span>
        
        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-stone-950 tracking-tight leading-[1.1]">
          Keep Every Volunteer Reference With the Application.
        </h1>
        
        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-3xl mx-auto leading-relaxed">
          Each volunteer application records a reference's name, phone, and email. The camp director reviews it by hand and approves it in the same dashboard as medical holds.
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
            <span>One Reference Per Application</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Director Review in the Dashboard</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Included at No Extra Charge</span>
          </span>
        </div>
      </section>

      {/* REAL PRODUCT SCREEN */}
      <section className="max-w-5xl mx-auto space-y-4">
        <ProductShot name="admin" alt="Director dashboard with volunteer references waiting for review" caption="The director dashboard in the demo camp. Reference notes wait in the same queue as medical holds." />
        <p className="text-center text-sm font-bold">
          <Link href="/demo" className="text-forest-900 underline underline-offset-4 hover:text-forest-700">See every screen in the product tour →</Link>
        </p>
      </section>

      {/* 2. THE 4 CORE PAIN POINTS OF THE OLD WAY */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-12 border border-stone-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-rose-800 tracking-wider">THE OLD WAY</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            The Spring Hiring Bottleneck Every Camp Director Faces
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Manual volunteer reference checking is the single most time-consuming task in camp administration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">1</div>
          <h3 className="font-display font-black text-lg text-stone-950">Endless Phone Tag with Pastors & Mentors</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Directors spend 40 to 60 hours leaving voicemails, coordinating callback times, and chasing references across multiple time zones.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">2</div>
          <h3 className="font-display font-black text-lg text-stone-950">Email Reference Forms Trapped in Spam</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Online web forms sent via email frequently land in junk folders, resulting in low response rates and delayed counselor hiring.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">3</div>
          <h3 className="font-display font-black text-lg text-stone-950">Inconsistent & Subjective Screening</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Different staff members take different handwritten notes, leaving gaps in child safety verification and ACA compliance documentation.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">4</div>
          <h3 className="font-display font-black text-lg text-stone-950">Hiring Deadlines Missed Before Staff Week</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Counselors arrive for orientation without fully vetted reference files, creating liability risks for the camp board.
        </p>
      </div>
        </div>
      </section>

      {/* 3. DEEP COMPARISON MATRIX */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 tracking-wider">SIDE-BY-SIDE EVALUATION</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Manual reference calling, organized in one place
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            See what changes when reference details live in one system.
          </p>
        </div>

        <div className="overflow-x-auto border-2 border-stone-200 rounded-3xl bg-white shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-900 font-black border-b-2 border-stone-200">
              <tr>
                <th className="p-4 sm:p-5">Feature & Operational Dimension</th>
                <th className="p-4 sm:p-5 text-stone-600">Spreadsheet and Email</th>
                <th className="p-4 sm:p-5 bg-emerald-50 text-emerald-950 font-black">CamperRoster Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr>
        <td className="p-4 sm:p-5 font-bold">Collecting Reference Contacts</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">Emails and Spreadsheets</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Captured on the Volunteer Application</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Interview Delivery Method</td>
        <td className="p-4 sm:p-5 text-stone-600">Manual Dialing & Voicemails</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Director Calls Using the Number on File</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Where the Record Lives</td>
        <td className="p-4 sm:p-5 text-stone-600">Hand-Written Notes in a Folder</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Attached to the Applicant&apos;s Record</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Approval Status</td>
        <td className="p-4 sm:p-5 text-stone-600">Remembered or Lost</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Marked Approved by the Director</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Retry & Follow-up Status</td>
        <td className="p-4 sm:p-5 text-stone-600">Manual Sticky Notes & Reminders</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Director-managed follow-up today</td>
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
            How Volunteer Reference Tracking Works
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            A simple record of who vouched for each volunteer.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">🎙️ Reference on the Application</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          The application captures a reference contact so a camp leader can ask consistent questions about reliability, character with children, and work ethic.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">📋 Director Command Dashboard</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          References waiting on review show up in the director dashboard next to medical holds. The director approves each one after the call.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">📱 Follow-up Tracking</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          If a reference does not answer, the camp team decides when to try again. The reference stays waiting for review until the director approves it.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">🔒 Medical Data Stays Separate</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Volunteer records sit in the same system as campers, but camper medical data stays visible only to the health staff you assign.
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
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Bring Over Past Rosters (Optional)</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Automatic imports are not available yet. Send us your past spreadsheet or UltraCamp export and we help you move it over during setup.
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
          <FaqJsonLd faqs={faqs} />
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
              <div hidden={openFaq !== idx} className="p-5 pt-0 text-xs sm:text-sm text-stone-600 font-medium leading-relaxed border-t border-stone-100">
                {faq.a}
              </div>
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
          $0 setup, $0 off-season retainers, and free help moving your roster over. Join the modern standard for summer camp operations.
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

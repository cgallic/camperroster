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
    "q": "Can families from several churches register for one camp session?",
    "a": "Yes. Each family registers through the same session link and gets its own balance. There are no church group blocks or per-church balances, but admins can set a custom total for a family by hand."
  },
  {
    "q": "How does CamperRoster help youth pastors review volunteer references?",
    "a": "CamperRoster collects pastoral and mentor reference details with each volunteer application and keeps the director's manual review attached to the applicant. The director makes the calls."
  },
  {
    "q": "Does CamperRoster charge off-season retainer fees?",
    "a": "No! CamperRoster charges $0/month in the off-season. You only pay when campers register."
  },
  {
    "q": "Can parents pay in monthly installments?",
    "a": "Yes. Families choose pay in full, two payments, or monthly at registration. Each installment gets a due date, and parents pay it by card through Stripe Checkout from the parent portal."
  }
];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>CHURCH YOUTH CAMPS & RETREATS</span>
        </span>
        
        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-stone-950 tracking-tight leading-[1.1]">
          Church Camp Registration Software Built for Youth Group Sign-Ups.
        </h1>
        
        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-3xl mx-auto leading-relaxed">
          Open a session, share one link, and let youth group families finish registration on a phone. Health forms, typed e-signatures, cabin buddy requests, and card payment plans are all handled inside the form.
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
            <span>Shareable Registration Links</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pastoral Reference Tracking</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Card Payment Plans</span>
          </span>
        </div>
      </section>

      {/* REAL PRODUCT SCREEN */}
      <section className="max-w-5xl mx-auto space-y-4">
        <ProductShot name="cabins" alt="Cabin board placing church campers by grade and gender with spots remaining" caption="The cabin board in the demo camp, with buddy-friendly placement and spots left per cabin." />
        <p className="text-center text-sm font-bold">
          <Link href="/demo" className="text-forest-900 underline underline-offset-4 hover:text-forest-700">See every screen in the product tour →</Link>
        </p>
      </section>

      {/* 2. THE 4 CORE PAIN POINTS OF THE OLD WAY */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-12 border border-stone-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-rose-800 tracking-wider">THE OLD WAY</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Where Church Camp Registration Breaks Down on Generic Forms
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Generic event tools don't understand health forms, cabin buddy requests, or pastoral volunteer references.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">1</div>
          <h3 className="font-display font-black text-lg text-stone-950">Medical Forms Chased by Email</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Youth leaders chase immunization records and insurance cards by email the week before camp, and some never arrive.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">2</div>
          <h3 className="font-display font-black text-lg text-stone-950">Calling 50+ Pastors for Volunteer Screening</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Youth pastors spending weeks leaving voicemails with senior pastors and mentors to vet volunteer cabin leaders.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">3</div>
          <h3 className="font-display font-black text-lg text-stone-950">Forgotten Parent Passwords & Incomplete Forms</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Parents giving up during registration because they can't remember passwords from the previous summer.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">4</div>
          <h3 className="font-display font-black text-lg text-stone-950">Year-Round Monthly Retainer Bills</h3>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Software vendors billing $300+/month in the dead of winter when church camp registration is closed.
        </p>
      </div>
        </div>
      </section>

      {/* 3. DEEP COMPARISON MATRIX */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 tracking-wider">SIDE-BY-SIDE EVALUATION</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Generic Registration vs CamperRoster Church Camp OS
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Built specifically for youth ministries, retreats, and denomination camps.
          </p>
        </div>

        <div className="overflow-x-auto border-2 border-stone-200 rounded-3xl bg-white shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-900 font-black border-b-2 border-stone-200">
              <tr>
                <th className="p-4 sm:p-5">Feature & Operational Dimension</th>
                <th className="p-4 sm:p-5 text-stone-600">Generic Event Tools</th>
                <th className="p-4 sm:p-5 bg-emerald-50 text-emerald-950 font-black">CamperRoster Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr>
        <td className="p-4 sm:p-5 font-bold">Pastoral Reference Verification</td>
        <td className="p-4 sm:p-5 text-stone-600">Manual Staff Calling (40+ hours)</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Reference Details + Manual Review</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Winter Off-Season Retainer</td>
        <td className="p-4 sm:p-5 text-rose-700 font-bold">$275 – $975 / month</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">$0.00 / month (100% Free in Winter)</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Parent Login Experience</td>
        <td className="p-4 sm:p-5 text-stone-600">Forgotten Password Resets Required</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Shareable Registration Links</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Family Balances</td>
        <td className="p-4 sm:p-5 text-stone-600">Manual Workarounds</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Per-Family Balances, With Custom Totals Set by Hand</td>
      </tr>
      <tr>
        <td className="p-4 sm:p-5 font-bold">Mutual Cabin Buddy Matching</td>
        <td className="p-4 sm:p-5 text-stone-600">Manual Spreadsheet Sorting</td>
        <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Buddy Requests Captured at Registration</td>
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
            Purpose-Built for Youth Pastors & Retreat Leaders
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Everything needed to run smooth, safe church camps and retreats.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">🎙️ Pastoral Reference Review</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Collect pastoral reference details with the application and keep the camp director's manual review attached to the applicant.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">⛪ Family Payment Plans</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Families pick pay in full, two payments, or monthly. Admins can set a custom total for a family by hand when a church helps cover the cost.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">⚡ Fast Gate Drop-Off</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Gate staff search the camper by name, see their cabin and counselor, and confirm arrival with one tap.
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
        <b className="font-display font-black text-lg text-stone-950 block">💌 Daily Bunk Notes Mail Call</b>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Staff enter bunk notes for campers and print the day&apos;s notes in one click for mail call.
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
            How Church Camp Registration Runs, Step by Step
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            From opening the session to a completed roster, without a spreadsheet or a single password reset.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 1</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Open the Session &amp; Set Pricing</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Set session dates, grade tiers, and pricing at /start. Families choose their payment plan when they register.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 2</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Send One Link to the Youth Group</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Families open the shared registration link and complete the form, including cabin buddy requests.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 3</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Track Balances and Missing Forms</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Watch each family's balance and each camper's outstanding medical uploads. Parents pay each dated installment by card from the portal.
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

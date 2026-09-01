"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Sparkles,
  QrCode,
  DollarSign,
  Users,
  Tablet,
  FileSpreadsheet,
  ChevronDown,
  Mail
} from "lucide-react";

export default function B2BSaasHomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "How does the $0 off-season pricing model work for our camp?",
      a: "Unlike legacy systems like UltraCamp that bill camps $275 to $975 every month year-round, CamperRoster charges $0/month during your 7 to 9 off-season months. You only pay a flat $4 to $6 per registered camper during active registration seasons."
    },
    {
      q: "How does the KaiCalls automated volunteer reference check work?",
      a: "When a counselor or staff applicant applies, KaiCalls AI Voice Assistant automatically dials their pastor, youth leader, or mentor. It conducts a friendly 2-minute safety interview, records the call, and delivers a verified transcript and safety assessment directly to your director dashboard."
    },
    {
      q: "How do we migrate our existing roster data from UltraCamp or spreadsheets?",
      a: "Our built-in 1-Click Importer (/admin/import) auto-maps your past UltraCamp CSV or Google Sheets export in 60 seconds. All family contacts, camper records, and allergy histories transfer instantly with zero manual re-typing."
    },
    {
      q: "Is CamperRoster HIPAA and ACA safety compliant?",
      a: "Yes. All medical disclosures, EpiPen care plans, and health insurance card uploads are encrypted with Row-Level Security (RLS) in PostgreSQL, isolating confidential medical records exclusively to licensed Health Lodge staff in compliance with ACA and HIPAA standards."
    }
  ];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 overflow-x-hidden">
      
      {/* 1. HERO SECTION (B2B SAAS SOFTWARE FOR CAMP DIRECTORS) */}
      <section className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-10">
        <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative min-h-[580px] sm:min-h-[640px] flex flex-col justify-between p-6 sm:p-12 lg:p-16 border-2 border-stone-800 shadow-2xl bg-stone-950">
          
          {/* BACKGROUND WITH SOLID DARK SCRIM */}
          <Image
            src="/images/camp_hero.jpg"
            alt="Camp Management Software Background"
            fill
            priority
            className="object-cover opacity-25 filter brightness-75"
          />

          {/* TOP EYEBROW BADGES */}
          <div className="relative z-10 flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="bg-amber-400 text-stone-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md">
              THE CAMP OPERATING SYSTEM
            </span>
            <span className="bg-emerald-400 text-stone-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>$0/MO IN OFF-SEASON</span>
            </span>
            <Link
              href="/ultracamp-alternative"
              className="text-xs font-mono font-bold text-stone-300 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full transition-colors backdrop-blur-xs flex items-center gap-1"
            >
              <span>vs UltraCamp ($6k Saved) →</span>
            </Link>
          </div>

          {/* HERO HEADLINE & B2B SOFTWARE CTAS */}
          <div className="relative z-10 max-w-3xl space-y-6 pt-8 sm:pt-12">
            <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] drop-shadow-md">
              Get every camper and volunteer ready <span className="text-emerald-400">before opening day.</span>
            </h1>

            <p className="text-base sm:text-xl text-stone-200 font-medium leading-relaxed max-w-2xl drop-shadow-sm">
              The modern camp registration and operations platform. Built to eliminate parent drop-off, automate staff reference checks with KaiCalls Voice AI, and cut winter software retainers to $0.
            </p>

            {/* ACTION BUTTONS */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                href="/start"
                className="px-8 py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-98 transition-transform"
              >
                <span>Launch Your Camp ($0 Setup)</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>
              <Link
                href="/c/camphope"
                className="px-6 py-4 rounded-xl bg-stone-900/90 hover:bg-stone-900 text-white font-bold text-xs sm:text-sm border border-stone-700 flex items-center justify-center gap-2 backdrop-blur-xs"
              >
                <span>View Live Camp Hope Demo →</span>
              </Link>
            </div>

            {/* TRUST BAR / HIGHLIGHTS */}
            <div className="pt-4 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-stone-300 font-bold border-t border-stone-800/80">
              <span className="flex items-center gap-1.5 text-stone-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Off-Season Fees</span>
              </span>
              <span className="flex items-center gap-1.5 text-stone-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>KaiCalls Voice AI References</span>
              </span>
              <span className="flex items-center gap-1.5 text-stone-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Health Lodge eMAR</span>
              </span>
              <span className="flex items-center gap-1.5 text-stone-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ACA & HIPAA Compliant</span>
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* 2. THE COMPLETE SOFTWARE OPERATIONS SUITE (WHAT WE SELL) */}
      <section className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="eyebrow-pill bg-forest-100 text-forest-900 border border-forest-200">
            ALL-IN-ONE CAMP OPERATING SYSTEM
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-stone-950">
            Everything your camp needs in one unified platform.
          </h2>
          <p className="text-sm sm:text-base text-stone-600 font-medium">
            Replace 4 fragmented software subscriptions with one intuitive platform built for directors, nurses, counselors, and parents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* TOOL 1: 5-STEP REGISTRATION WIZARD */}
          <div className="bg-white rounded-3xl p-7 border-2 border-stone-200 shadow-md space-y-4 hover:border-forest-800 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-900 flex items-center justify-center border border-forest-200">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl text-stone-950">5-Step Mobile Parent Registration</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Frictionless registration wizard with 16px touch inputs (no iOS zoom bugs), multi-camper household discounts, camera insurance uploads, and deposit schedules.
              </p>
            </div>
            <Link href="/register" className="text-xs font-black text-forest-900 flex items-center gap-1 hover:underline pt-2">
              <span>Test Registration Flow →</span>
            </Link>
          </div>

          {/* TOOL 2: KAICALLS VOICE AI REFERENCES */}
          <div className="bg-white rounded-3xl p-7 border-2 border-amber-300 shadow-md space-y-4 hover:border-amber-500 transition-all flex flex-col justify-between bg-amber-50/20">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center border border-amber-300">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-xl text-stone-950">KaiCalls Voice AI References</h3>
                <span className="text-[10px] font-bold bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full">AI MOAT</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Cuts 40+ hours of spring phone tag. Voice AI calls pastoral and mentor references, conducts 2-minute interviews, and saves verified transcripts with safety scores.
              </p>
            </div>
            <Link href="/volunteer" className="text-xs font-black text-amber-900 flex items-center gap-1 hover:underline pt-2">
              <span>See Volunteer Voice Demo →</span>
            </Link>
          </div>

          {/* TOOL 3: HEALTH LODGE EMAR */}
          <div className="bg-white rounded-3xl p-7 border-2 border-stone-200 shadow-md space-y-4 hover:border-forest-800 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-900 flex items-center justify-center border border-emerald-200">
                <Tablet className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl text-stone-950">Health Lodge Tablet eMAR</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Tablet medication dispenser for camp nurses. Schedule and log Breakfast, Lunch, Dinner, and Bedtime doses with timestamped records compliant with ACA and HIPAA.
              </p>
            </div>
            <Link href="/nurse/emar" className="text-xs font-black text-emerald-900 flex items-center gap-1 hover:underline pt-2">
              <span>View Nurse Tablet eMAR →</span>
            </Link>
          </div>

          {/* TOOL 4: 45-SEC EXPRESS GATE CHECK-IN */}
          <div className="bg-white rounded-3xl p-7 border-2 border-stone-200 shadow-md space-y-4 hover:border-forest-800 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-900 flex items-center justify-center border border-purple-200">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl text-stone-950">45-Second Express Gate QR Check-In</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Eliminate Sunday vehicle drop-off traffic. Parents show their digital boarding pass QR; gate counselors scan to verify RN medical clearance and cabin placement instantly.
              </p>
            </div>
            <Link href="/admin/checkin" className="text-xs font-black text-purple-900 flex items-center gap-1 hover:underline pt-2">
              <span>Test Express Gate Scanner →</span>
            </Link>
          </div>

          {/* TOOL 5: CASHLESS CANTEEN STORE POS */}
          <div className="bg-white rounded-3xl p-7 border-2 border-stone-200 shadow-md space-y-4 hover:border-forest-800 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-900 flex items-center justify-center border border-sky-200">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl text-stone-950">Cashless Canteen Store POS</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Campers buy snacks and merchandise with digital wristbands. Parents reload balances online from the portal with zero cash lost in the lake or cabin.
              </p>
            </div>
            <Link href="/canteen/pos" className="text-xs font-black text-sky-900 flex items-center gap-1 hover:underline pt-2">
              <span>View Canteen POS Register →</span>
            </Link>
          </div>

          {/* TOOL 6: DAILY BUNK NOTES BATCH PRINTER */}
          <div className="bg-white rounded-3xl p-7 border-2 border-stone-200 shadow-md space-y-4 hover:border-forest-800 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-900 flex items-center justify-center border border-rose-200">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl text-stone-950">Daily Bunk Notes 11:00 AM Mail Call</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Parents submit daily letters online. Directors click 1 button to print sorted, formatted 8.5x11 sheets grouped by cabin for daily counselor mail call.
              </p>
            </div>
            <Link href="/admin/bunk-notes" className="text-xs font-black text-rose-900 flex items-center gap-1 hover:underline pt-2">
              <span>View Bunk Notes Batch Sheet →</span>
            </Link>
          </div>

        </div>
      </section>

      {/* 3. FLAGSHIP TENANT SHOWCASE (CASE STUDY: CAMP HOPE 2027) */}
      <section className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-stone-950 text-white rounded-3xl p-6 sm:p-12 border-2 border-stone-800 shadow-2xl space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest">
                FLAGSHIP CUSTOMER CASE STUDY
              </span>
              <h3 className="font-display font-black text-2xl sm:text-4xl text-white">
                How Camp Hope Cut $6,150 in Software Costs & 40 Hours of Phone Tag
              </h3>
            </div>
            <Link
              href="/c/camphope"
              className="px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs sm:text-sm shrink-0 flex items-center gap-1.5"
            >
              <span>Explore Camp Hope Portal</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
              <b className="font-display font-black text-3xl sm:text-4xl text-emerald-400 block">$6,150 / yr</b>
              <span className="text-xs font-bold text-stone-300 block">Annual Software Savings</span>
              <p className="text-xs text-stone-400 leading-relaxed pt-1">
                Eliminated UltraCamp&apos;s winter monthly retainer and bundled CampDoc and Bunk1 into one subscription.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
              <b className="font-display font-black text-3xl sm:text-4xl text-amber-400 block">40 Hours</b>
              <span className="text-xs font-bold text-stone-300 block">Director Phone Tag Eliminated</span>
              <p className="text-xs text-stone-400 leading-relaxed pt-1">
                KaiCalls Voice AI automated 90+ volunteer pastoral reference check interviews with audio and transcripts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
              <b className="font-display font-black text-3xl sm:text-4xl text-sky-400 block">45 Seconds</b>
              <span className="text-xs font-bold text-stone-300 block">Opening Day Gate Drop-Off</span>
              <p className="text-xs text-stone-400 leading-relaxed pt-1">
                Zero vehicle lines on Sunday check-in with 100% digital medical clearance on parents&apos; phones.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. MIGRATION & ULTRACAMP TEARDOWN */}
      <section className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-12 border-2 border-stone-300 shadow-xl space-y-8">
          
          <div className="max-w-3xl space-y-2">
            <span className="eyebrow-pill bg-rose-100 text-rose-950 border border-rose-300">
              MIGRATION MADE SIMPLE
            </span>
            <h3 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
              Switching from UltraCamp or Spreadsheets takes 60 seconds.
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Export your existing roster CSV and drop it into our 1-Click Importer. All parent contacts, camper medical profiles, and history map automatically into your new camp database.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/admin/import" className="btn-primary-agency text-xs sm:text-sm py-4 px-8">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Test 1-Click Roster Importer</span>
            </Link>
            <Link href="/pricing" className="px-6 py-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm text-center">
              Calculate Your Camp&apos;s Savings →
            </Link>
          </div>

        </div>
      </section>

      {/* 5. FAQ ACCORDION */}
      <section className="px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-stone-500 tracking-wider">FAQ</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Frequently Asked Questions by Camp Directors
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

      {/* 6. BOTTOM CTA (B2B SOFTWARE ONBOARDING) */}
      <section className="px-3 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-forest-950 text-white rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-2xl border-2 border-emerald-400">
          <span className="eyebrow-pill bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
            READY FOR SUMMER 2027?
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-white">
            Launch your camp portal in 3 minutes.
          </h2>
          <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
            $0 setup, $0 off-season retainers, and free 1-click roster migration. Join the modern standard for camp management.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/start"
              className="px-10 py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-sm shadow-xl active:scale-98 transition-transform"
            >
              Create Camp Portal ($0 Setup) →
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}

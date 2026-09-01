"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  Calendar,
  Users,
  ArrowUpRight,
  ChevronDown,
  Stethoscope,
  ShoppingBag,
  TrendingDown,
  Smartphone,
  Zap,
  Check
} from "lucide-react";
import KaiCallsSimulatorModal from "@/components/KaiCallsSimulatorModal";

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const programs = [
    {
      title: "Junior Camp (Grades 2–4)",
      dates: "July 11 – July 17, 2027",
      price: "$650",
      deposit: "$100",
      ratio: "1:4 Staff Ratio",
      spotsLeft: "8 Spots Left",
      desc: "Gentle introduction to overnight camp with nurturing cabin counselors, beginner lake kayaking, craft lodge, and campfire fellowship.",
    },
    {
      title: "Intermediate Camp (Grades 5–6)",
      dates: "July 18 – July 24, 2027",
      price: "$650",
      deposit: "$100",
      ratio: "1:5 Staff Ratio",
      spotsLeft: "14 Spots Left",
      desc: "High-energy adventure featuring archery, ropes course challenges, wilderness survival skills, and lake canoeing.",
    },
    {
      title: "Senior Teen Camp (Grades 7–8)",
      dates: "July 25 – July 31, 2027",
      price: "$675",
      deposit: "$100",
      ratio: "1:6 Staff Ratio",
      spotsLeft: "6 Spots Left",
      desc: "Leadership development, night games, acoustic worship by the lake, deep cabin discussions, and outdoor expeditions.",
    }
  ];

  const painPoints = [
    {
      legacy: "UltraCamp charges $475–$975/month in winter",
      camperroster: "$0/month in the off-season — pay only when operating",
      icon: TrendingDown,
      color: "text-emerald-800",
      bg: "bg-emerald-100"
    },
    {
      legacy: "Weeks of telephone tag checking volunteer references",
      camperroster: "Automated 2-minute KaiCalls AI voice interviews & transcripts",
      icon: PhoneCall,
      color: "text-amber-800",
      bg: "bg-amber-100"
    },
    {
      legacy: "Incomplete paper health forms on opening day check-in",
      camperroster: "1-Tap SMS magic links sent directly to parents' mobile phones",
      icon: Smartphone,
      color: "text-blue-800",
      bg: "bg-blue-100"
    },
    {
      legacy: "Clunky 2004 desktop interface that fails on iPhones",
      camperroster: "High-contrast mobile web app with camera insurance card capture",
      icon: Zap,
      color: "text-purple-800",
      bg: "bg-purple-100"
    }
  ];

  const faqs = [
    {
      q: "How does the $0 off-season pricing model work?",
      a: "Unlike legacy systems that lock camps into $275–$975 monthly retainers year-round, CamperRoster charges $0/month during your 7–9 off-season months. You only pay a simple, transparent fee during active registration periods."
    },
    {
      q: "How does the KaiCalls automated reference calling work?",
      a: "When a volunteer or counselor applies, KaiCalls AI Voice Assistant calls their pastor or professional mentor directly. It conducts a structured 2-minute safety interview, records the audio, and saves the verified transcript and safety score directly into your director dashboard."
    },
    {
      q: "Can parents register multiple children and choose installment plans?",
      a: "Yes! Parents can register their entire household in one session, choose between $100 deposit plans, 3-month automated installment schedules, or pay-in-full, and upload medical records with zero password friction."
    },
    {
      q: "Is CamperRoster HIPAA and ACA safety compliant?",
      a: "Yes. All medical disclosures, EpiPen care plans, and health insurance card uploads are encrypted with Row-Level Security (RLS) in PostgreSQL, isolating confidential medical records exclusively to licensed Health Lodge staff."
    }
  ];

  return (
    <main className="space-y-24 sm:space-y-36 pb-24">
      
      {/* 1. HERO SECTION: 100% ADA & WCAG AAA COMPLIANT HIGH-CONTRAST HERO */}
      <section className="pt-4 sm:pt-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="relative w-full rounded-3xl overflow-hidden bg-stone-950 shadow-2xl border-2 border-stone-800">
            {/* Background Image with High-Contrast Dark Scrim */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/camp_hero.jpg"
                alt="Camp Hope lake at golden hour with canoes"
                fill
                priority
                className="object-cover object-center opacity-40 scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/90 to-stone-950/60"></div>
            </div>

            <div className="relative z-10 p-8 sm:p-14 lg:p-16 flex flex-col justify-between min-h-[600px] text-white space-y-10">
              
              {/* TOP ACCESSIBLE BADGES */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400 text-stone-950 font-extrabold text-xs tracking-wider uppercase shadow-md">
                    <Sparkles className="w-4 h-4 text-stone-950" />
                    <span>SUMMER 2027 REGISTRATION OPEN</span>
                  </span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400 text-stone-950 font-extrabold text-xs tracking-wider uppercase shadow-md">
                    <Check className="w-4 h-4 text-stone-950" />
                    <span>LIMITED SPOTS REMAINING</span>
                  </span>
                </div>

                <Link
                  href="/portal"
                  className="px-5 py-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-white font-extrabold text-xs border-2 border-stone-600 transition-colors shadow-sm"
                >
                  Parent Portal Login →
                </Link>
              </div>

              {/* MAIN HERO CONTENT (HIGH CONTRAST WHITE ON 95% DARK) */}
              <div className="space-y-6 max-w-3xl">
                <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-white leading-[1.08] tracking-tight">
                  Where lifelong friendships and faith take root.
                </h1>
                
                <p className="text-lg sm:text-2xl text-stone-100 font-semibold leading-relaxed max-w-2xl">
                  An unforgettable week of outdoor canoeing, rustic timber cabin fellowship, and character-building adventures for campers entering grades 2–8.
                </p>

                {/* PRIMARY ACTIONS WITH MAXIMUM CONTRAST */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-3 px-8 py-4.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-base shadow-2xl transition-all hover:scale-102"
                  >
                    <span>Register a Camper ($100 Deposit)</span>
                    <ArrowUpRight className="w-5 h-5 stroke-[3]" />
                  </Link>

                  <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2.5 px-6 py-4.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-sm border-2 border-stone-600 transition-all cursor-pointer shadow-lg"
                  >
                    <PhoneCall className="w-4 h-4 text-amber-400" />
                    <span>Call KaiCalls AI Assistant (24/7)</span>
                  </button>
                </div>
              </div>

              {/* BOTTOM ATTRIBUTE PILLARS */}
              <div className="pt-6 border-t-2 border-stone-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-bold text-stone-200">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>July 11 – 31, 2027</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Grades 2–8 Co-Ed</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Stethoscope className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>24/7 Licensed RN Onsite</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
                  <span>ACA Accredited Safety</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2. SUMMER 2027 SESSIONS (HIGH-CONTRAST ACCESSIBLE CARDS) */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-900 text-white font-bold text-xs uppercase tracking-widest">
              SUMMER 2027 SESSIONS
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-stone-950 tracking-tight">
              Choose the perfect week for your camper.
            </h2>
            <p className="text-sm sm:text-base text-stone-700 font-medium">
              All sessions include 6 nights of lodging, all meals, snacks, camp t-shirt, water sports, and daily activities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {programs.map((p, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 border-2 border-stone-300 shadow-lg space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-forest-950 bg-forest-100 px-3 py-1 rounded-full border border-forest-200">
                      {p.ratio}
                    </span>
                    <span className="font-bold text-xs text-amber-950 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                      {p.spotsLeft}
                    </span>
                  </div>

                  <h3 className="font-display font-black text-2xl text-stone-950">{p.title}</h3>
                  
                  <div className="text-sm font-bold text-forest-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-forest-800" />
                    <span>{p.dates}</span>
                  </div>

                  <p className="text-sm text-stone-700 leading-relaxed font-medium">{p.desc}</p>
                </div>

                <div className="space-y-4 pt-6 border-t-2 border-stone-200">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-display font-black text-3xl text-stone-950">{p.price}</span>
                      <span className="text-xs text-stone-600 font-semibold"> / full week</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      {p.deposit} deposit to hold
                    </span>
                  </div>

                  <Link
                    href="/register"
                    className="w-full py-4 px-6 rounded-2xl bg-forest-900 hover:bg-forest-950 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>Reserve Spot ({p.deposit} Deposit)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. FLAGSHIP SHOWCASE: CAMP HOPE */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden bg-stone-900 text-white p-8 sm:p-14 border-2 border-stone-800 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-full bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider">
                  FLAGSHIP CUSTOMER
                </span>
                <span className="text-sm font-bold text-stone-300">
                  Camp Hope • Summer 2027
                </span>
              </div>

              <h2 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight">
                &quot;We switched from UltraCamp and eliminated 40 hours of volunteer phone tag.&quot;
              </h2>

              <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-medium">
                Camp Hope uses CamperRoster to power its 5-step parent registration, automated pastoral reference calling, health lodge eMAR, and cashless canteen point-of-sale.
              </p>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-stone-800 text-sm font-bold text-stone-300">
                <div>
                  <b className="font-display font-black text-3xl text-amber-400 block">100</b>
                  <span>Campers Registered</span>
                </div>
                <div>
                  <b className="font-display font-black text-3xl text-emerald-400 block">100%</b>
                  <span>Med Forms Complete</span>
                </div>
                <div>
                  <b className="font-display font-black text-3xl text-sky-400 block">2 Min</b>
                  <span>Reference Checks</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-full bg-emerald-400 text-stone-950 font-black text-sm hover:bg-emerald-300 transition-colors"
                >
                  Test Camp Hope Registration →
                </Link>
                <Link
                  href="/portal"
                  className="px-6 py-3.5 rounded-full bg-stone-800 hover:bg-stone-700 text-white font-bold text-sm border-2 border-stone-600 transition-colors"
                >
                  Parent Portal Demo
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-2xl border-2 border-stone-700">
              <Image
                src="/images/camp_hero.jpg"
                alt="Camp Hope lake scenery"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-6">
                <div>
                  <span className="font-mono text-xs font-bold text-amber-300 uppercase tracking-widest block">
                    Camp Hope • Session 1
                  </span>
                  <b className="text-white text-base font-extrabold">July 11–17, 2027 • Grades 2–8</b>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. ULTRACAMP TEARDOWN (HIGH CONTRAST) */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-200 text-amber-950 font-black text-xs uppercase tracking-widest">
              THE ULTRACAMP TEARDOWN
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-stone-950 tracking-tight">
              Built to fix everything camp directors hate about legacy software.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {painPoints.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-white rounded-3xl p-8 border-2 border-stone-300 shadow-md space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-xs uppercase text-rose-950 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
                        Legacy UltraCamp
                      </span>
                      <p className="text-sm sm:text-base font-bold text-stone-700 line-through decoration-rose-500 pt-1">
                        {item.legacy}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t-2 border-stone-100">
                      <span className="font-bold text-xs uppercase text-emerald-950 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                        CamperRoster Standard
                      </span>
                      <p className="text-base sm:text-lg font-black text-stone-950 pt-1">
                        {item.camperroster}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. PARENT FAQS ACCORDION */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-200 text-stone-950 font-bold text-xs uppercase tracking-widest">
              CAMP DIRECTORS & PARENTS
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-stone-950">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-white rounded-2xl border-2 border-stone-300 shadow-xs overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-display font-extrabold text-base sm:text-lg text-stone-950 hover:text-forest-900 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-forest-900" : "text-stone-500"}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 text-sm sm:text-base text-stone-800 font-medium leading-relaxed border-t-2 border-stone-100 animate-in fade-in duration-300">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      <KaiCallsSimulatorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </main>
  );
}

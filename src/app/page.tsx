"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Sparkles,
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
    <main className="space-y-16 sm:space-y-28 lg:space-y-36 pb-20 sm:pb-28">
      
      {/* 1. HERO SECTION: 100% ADA & MOBILE RESPONSIVE */}
      <section className="pt-2 sm:pt-6 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-950 shadow-2xl border sm:border-2 border-stone-800">
            {/* Background Image with High-Contrast Dark Scrim */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/camp_hero.jpg"
                alt="Camp Hope lake at golden hour with canoes"
                fill
                priority
                className="object-cover object-center opacity-40 scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/90 to-stone-950/70 sm:to-stone-950/50"></div>
            </div>

            <div className="relative z-10 p-5 sm:p-10 lg:p-14 flex flex-col justify-between min-h-[520px] sm:min-h-[600px] text-white space-y-8 sm:space-y-10">
              
              {/* TOP ACCESSIBLE BADGES */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-amber-400 text-stone-950 font-extrabold text-[11px] sm:text-xs tracking-wider uppercase shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-stone-950 shrink-0" />
                    <span>SUMMER 2027 REGISTRATION</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-emerald-400 text-stone-950 font-extrabold text-[11px] sm:text-xs tracking-wider uppercase shadow-md">
                    <Check className="w-3.5 h-3.5 text-stone-950 shrink-0" />
                    <span>LIMITED SPOTS</span>
                  </span>
                </div>

                <Link
                  href="/portal"
                  className="w-max px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-stone-800/90 hover:bg-stone-700 text-white font-extrabold text-xs border border-stone-600 transition-colors shadow-sm"
                >
                  Parent Portal Login →
                </Link>
              </div>

              {/* MAIN HERO CONTENT */}
              <div className="space-y-4 sm:space-y-6 max-w-3xl">
                <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-7xl text-white leading-[1.12] tracking-tight">
                  Where lifelong friendships and faith take root.
                </h1>
                
                <p className="text-base sm:text-xl lg:text-2xl text-stone-100 font-semibold leading-relaxed max-w-2xl">
                  An unforgettable week of outdoor canoeing, rustic timber cabin fellowship, and character-building adventures for campers entering grades 2–8.
                </p>

                {/* PRIMARY ACTIONS */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-4 sm:px-8 sm:py-4.5 rounded-2xl sm:rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm sm:text-base shadow-xl transition-all active:scale-98 text-center"
                  >
                    <span>Register a Camper ($100 Deposit)</span>
                    <ArrowUpRight className="w-5 h-5 stroke-[3] shrink-0" />
                  </Link>

                  <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 sm:px-6 sm:py-4.5 rounded-2xl sm:rounded-full bg-stone-900/90 hover:bg-stone-800 text-white font-extrabold text-xs sm:text-sm border border-stone-600 transition-all cursor-pointer shadow-lg active:scale-98 text-center"
                  >
                    <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Call KaiCalls AI Assistant (24/7)</span>
                  </button>
                </div>
              </div>

              {/* BOTTOM ATTRIBUTE PILLARS */}
              <div className="pt-4 sm:pt-6 border-t border-stone-700 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm font-bold text-stone-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>July 11 – 31, 2027</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Grades 2–8 Co-Ed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>24/7 RN Onsite</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>ACA Safety</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2. SUMMER 2027 SESSIONS */}
      <section className="px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest-900 text-white font-bold text-[11px] sm:text-xs uppercase tracking-widest">
              SUMMER 2027 SESSIONS
            </span>
            <h2 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-stone-950 tracking-tight">
              Choose the perfect week for your camper.
            </h2>
            <p className="text-xs sm:text-base text-stone-700 font-medium max-w-lg mx-auto">
              All sessions include 6 nights of lodging, all meals, snacks, camp t-shirt, water sports, and daily activities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {programs.map((p, idx) => (
              <div key={idx} className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-md space-y-5 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[11px] sm:text-xs text-forest-950 bg-forest-100 px-3 py-1 rounded-full border border-forest-200">
                      {p.ratio}
                    </span>
                    <span className="font-bold text-[11px] sm:text-xs text-amber-950 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                      {p.spotsLeft}
                    </span>
                  </div>

                  <h3 className="font-display font-black text-xl sm:text-2xl text-stone-950">{p.title}</h3>
                  
                  <div className="text-xs sm:text-sm font-bold text-forest-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-forest-800 shrink-0" />
                    <span>{p.dates}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">{p.desc}</p>
                </div>

                <div className="space-y-3.5 pt-4 border-t border-stone-200">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-display font-black text-2xl sm:text-3xl text-stone-950">{p.price}</span>
                      <span className="text-xs text-stone-600 font-semibold"> / week</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {p.deposit} deposit
                    </span>
                  </div>

                  <Link
                    href="/register"
                    className="w-full py-3.5 px-4 rounded-xl sm:rounded-2xl bg-forest-900 hover:bg-forest-950 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <span>Reserve Spot ({p.deposit} Deposit)</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. FLAGSHIP SHOWCASE: CAMP HOPE */}
      <section className="px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 text-white p-6 sm:p-12 lg:p-14 border border-stone-800 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-amber-400 text-stone-950 font-black text-[11px] sm:text-xs uppercase tracking-wider">
                  FLAGSHIP CUSTOMER
                </span>
                <span className="text-xs sm:text-sm font-bold text-stone-300">
                  Camp Hope • Summer 2027
                </span>
              </div>

              <h2 className="font-display font-black text-2xl sm:text-4xl text-white leading-tight">
                &quot;We switched from UltraCamp and eliminated 40 hours of volunteer phone tag.&quot;
              </h2>

              <p className="text-xs sm:text-base text-stone-200 leading-relaxed font-medium">
                Camp Hope uses CamperRoster to power its 5-step parent registration, automated pastoral reference calling, health lodge eMAR, and cashless canteen point-of-sale.
              </p>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-stone-800 text-xs sm:text-sm font-bold text-stone-300">
                <div>
                  <b className="font-display font-black text-xl sm:text-3xl text-amber-400 block">100</b>
                  <span>Campers</span>
                </div>
                <div>
                  <b className="font-display font-black text-xl sm:text-3xl text-emerald-400 block">100%</b>
                  <span>Med Forms</span>
                </div>
                <div>
                  <b className="font-display font-black text-xl sm:text-3xl text-sky-400 block">2 Min</b>
                  <span>Ref Checks</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-xl sm:rounded-full bg-emerald-400 text-stone-950 font-black text-xs sm:text-sm hover:bg-emerald-300 transition-colors text-center"
                >
                  Test Registration Flow →
                </Link>
                <Link
                  href="/portal"
                  className="px-6 py-3 rounded-xl sm:rounded-full bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs sm:text-sm border border-stone-600 transition-colors text-center"
                >
                  Parent Portal Demo
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative h-56 sm:h-80 lg:h-96 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-stone-700">
              <Image
                src="/images/camp_hero.jpg"
                alt="Camp Hope lake scenery"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-4 sm:p-6">
                <div>
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-widest block">
                    Camp Hope • Session 1
                  </span>
                  <b className="text-white text-sm sm:text-base font-extrabold">July 11–17, 2027 • Grades 2–8</b>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. ULTRACAMP TEARDOWN */}
      <section className="px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-200 text-amber-950 font-black text-[11px] sm:text-xs uppercase tracking-widest">
              THE ULTRACAMP TEARDOWN
            </span>
            <h2 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-stone-950 tracking-tight">
              Built to fix what camp directors hate about legacy software.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {painPoints.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-md space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${item.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.color}`} />
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-[10px] sm:text-xs uppercase text-rose-950 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                        Legacy UltraCamp
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-stone-700 line-through decoration-rose-500 pt-0.5">
                        {item.legacy}
                      </p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-stone-100">
                      <span className="font-bold text-[10px] sm:text-xs uppercase text-emerald-950 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        CamperRoster Standard
                      </span>
                      <p className="text-sm sm:text-base font-black text-stone-950 pt-0.5">
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

      {/* 5. FAQS ACCORDION */}
      <section className="px-3 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-200 text-stone-950 font-bold text-[11px] sm:text-xs uppercase tracking-widest">
              CAMP DIRECTORS & PARENTS
            </span>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-white rounded-xl sm:rounded-2xl border-2 border-stone-200 shadow-xs overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-6 text-left flex items-center justify-between gap-3 font-display font-extrabold text-sm sm:text-lg text-stone-950 hover:text-forest-900 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-forest-900" : "text-stone-500"}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-1 text-xs sm:text-sm text-stone-800 font-medium leading-relaxed border-t border-stone-100 animate-in fade-in duration-300">
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

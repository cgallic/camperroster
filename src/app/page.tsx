"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  Calendar,
  Users,
  Compass,
  ArrowUpRight,
  ChevronDown,
  Check,
  Stethoscope,
  Waves,
  Flame,
  Home,
  MessageSquare
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
      spotsLeft: 8,
      desc: "Gentle introduction to overnight camp with nurturing cabin counselors, beginner lake kayaking, craft lodge, and campfire stories.",
    },
    {
      title: "Intermediate Camp (Grades 5–6)",
      dates: "July 18 – July 24, 2027",
      price: "$650",
      deposit: "$100",
      ratio: "1:5 Staff Ratio",
      spotsLeft: 14,
      desc: "High-energy adventure featuring archery, ropes course challenges, wilderness survival skills, and lake tubing.",
    },
    {
      title: "Senior Teen Camp (Grades 7–8)",
      dates: "July 25 – July 31, 2027",
      price: "$675",
      deposit: "$100",
      ratio: "1:6 Staff Ratio",
      spotsLeft: 6,
      desc: "Leadership development, night games, acoustic worship by the lake, deep cabin discussions, and canoe expeditions.",
    }
  ];

  const faqs = [
    {
      q: "How does the $100 deposit and installment payment plan work?",
      a: "You only pay a $100 deposit today to lock in your child's spot and cabin preference. The remaining balance is split into two equal installments on May 1 and June 1, with zero interest or hidden service fees."
    },
    {
      q: "How are severe peanut and food allergies handled?",
      a: "Our Health Lodge is staffed 24/7 by licensed Registered Nurses (RN). Camp Hope maintains a strict nut-aware dining hall with dedicated allergen-free prep tables, and counselors are trained on immediate EpiPen protocols."
    },
    {
      q: "Can my child request to be in the same cabin as a friend?",
      a: "Yes! During Step 4 of registration, you can enter up to two mutual cabin buddy requests. As long as the campers are in the same grade range, placement together is 100% guaranteed."
    },
    {
      q: "What if I need to update health records or insurance cards later?",
      a: "You can save your registration progress at any time and return via a secure 1-tap SMS magic link. You can upload updated immunization forms or insurance card photos anytime before June 15."
    }
  ];

  return (
    <main className="space-y-24 sm:space-y-36 pb-24">
      
      {/* 1. HERO SECTION: CINEMATIC CAMP HOPE SHOWCASE */}
      <section className="pt-6 sm:pt-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="double-bezel-outer p-2">
            <div className="relative w-full min-h-[580px] sm:min-h-[640px] rounded-[calc(2.25rem-0.5rem)] overflow-hidden flex flex-col justify-between p-8 sm:p-14 text-white">
              <Image
                src="/images/camp_hero.jpg"
                alt="Camp Hope lake at golden hour"
                fill
                priority
                className="object-cover object-center brightness-60 scale-102 transition-transform duration-1000 hover:scale-105"
              />

              {/* Top Status Badges */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                <span className="eyebrow-pill bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>SUMMER 2027 REGISTRATION NOW OPEN</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold bg-emerald-500/90 text-white px-3.5 py-1.5 rounded-full backdrop-blur-xs shadow-xs">
                    ● Limited Spots Remaining
                  </span>
                  <Link
                    href="/portal"
                    className="font-mono text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full backdrop-blur-xs transition-colors border border-white/30"
                  >
                    Parent Portal Login →
                  </Link>
                </div>
              </div>

              {/* Main Headline */}
              <div className="relative z-10 space-y-6 max-w-3xl my-auto">
                <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight">
                  Where lifelong friendships and faith take root.
                </h1>
                <p className="text-base sm:text-xl text-stone-100 leading-relaxed font-medium max-w-2xl">
                  An unforgettable week of outdoor canoeing, rustic cabin fellowship, and character-building adventures for campers entering grades 2–8.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link href="/register" className="btn-primary-agency py-4 px-8 text-sm group shadow-xl">
                    <span>Register a Camper ($100 Deposit)</span>
                    <span className="btn-icon-circle w-7 h-7">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </Link>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="px-6 py-3.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs border border-white/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-300" />
                    <span>Call KaiCalls AI Assistant (24/7)</span>
                  </button>
                </div>
              </div>

              {/* Key Attributes Bar */}
              <div className="relative z-10 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-stone-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>July 11 – July 31, 2027</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Grades 2–8 Co-Ed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>24/7 Licensed RN Onsite</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>ACA Accredited Safety</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2. SUMMER 2027 SESSIONS & PROGRAM EXPLORER */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="eyebrow-pill bg-forest-100 text-forest-900 border border-forest-200">
              SUMMER 2027 SESSIONS
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-stone-900 tracking-tight">
              Choose the perfect week for your camper.
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              All sessions include 6 nights of lodging, all meals and snacks, camp t-shirt, water sports, and daily activities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {programs.map((p, idx) => (
              <div key={idx} className="double-bezel-outer p-2 flex flex-col justify-between">
                <div className="double-bezel-inner p-8 space-y-6 flex flex-col justify-between h-full">
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-forest-800 bg-forest-50 px-3 py-1 rounded-full border border-forest-100">
                        {p.ratio}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                        {p.spotsLeft} Spots Left
                      </span>
                    </div>

                    <h3 className="font-display font-black text-2xl text-stone-900">{p.title}</h3>
                    <div className="text-xs font-semibold text-forest-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{p.dates}</span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">{p.desc}</p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-stone-100">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="font-display font-black text-3xl text-stone-900">{p.price}</span>
                        <span className="text-xs text-stone-500 font-normal"> / full week</span>
                      </div>
                      <span className="text-xs font-bold text-forest-800 font-mono">
                        {p.deposit} deposit to reserve
                      </span>
                    </div>

                    <Link
                      href="/register"
                      className="w-full py-3.5 px-6 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <span>Reserve Spot ({p.deposit} Deposit)</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. FOUR CAMP PILLARS */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="eyebrow-pill bg-amber-100 text-amber-900 border border-amber-200">
                THE CAMP HOPE EXPERIENCE
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-stone-900 tracking-tight">
                Rooted in community, safety, and outdoor adventure.
              </h2>
            </div>
            <Link href="/volunteer" className="text-xs font-bold text-forest-800 hover:underline flex items-center gap-1">
              <span>Apply to Join Summer Staff</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Pillar 1: Waterfront */}
            <div className="double-bezel-outer p-2 flex flex-col">
              <div className="double-bezel-inner overflow-hidden flex flex-col h-full">
                <div className="relative h-56 w-full">
                  <Image
                    src="/images/camp_hero.jpg"
                    alt="Lake canoeing"
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6 sm:p-8 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase text-sky-700 tracking-widest block mb-1">
                      WATERFRONT & LAKE
                    </span>
                    <h3 className="font-display font-extrabold text-xl text-stone-900">Lakeside Canoeing & Swimming</h3>
                    <p className="text-xs text-stone-600 leading-relaxed mt-2">
                      Red Cross certified lifeguards, enclosed swimming bays, kayak races, and giant lake inflatables.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-stone-100 text-xs font-bold text-stone-500">
                    Daily 2:00 PM – 5:00 PM
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 2: Campfire */}
            <div className="double-bezel-outer p-2 flex flex-col">
              <div className="double-bezel-inner overflow-hidden flex flex-col h-full">
                <div className="relative h-56 w-full">
                  <Image
                    src="/images/camp_campfire.jpg"
                    alt="Evening campfire"
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6 sm:p-8 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase text-amber-700 tracking-widest block mb-1">
                      FAITH & FELLOWSHIP
                    </span>
                    <h3 className="font-display font-extrabold text-xl text-stone-900">Evening Campfire Devotions</h3>
                    <p className="text-xs text-stone-600 leading-relaxed mt-2">
                      S&apos;mores, acoustic worship under the stars, character lessons, and meaningful cabin discussions.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-stone-100 text-xs font-bold text-stone-500">
                    Nightly at 7:30 PM
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 3: Timber Lodges */}
            <div className="double-bezel-outer p-2 flex flex-col">
              <div className="double-bezel-inner overflow-hidden flex flex-col h-full">
                <div className="relative h-56 w-full">
                  <Image
                    src="/images/camp_cabin.jpg"
                    alt="Timber cabins"
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6 sm:p-8 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase text-emerald-700 tracking-widest block mb-1">
                      HOUSING & CABIN LIFE
                    </span>
                    <h3 className="font-display font-extrabold text-xl text-stone-900">Modern Rustic Timber Cabins</h3>
                    <p className="text-xs text-stone-600 leading-relaxed mt-2">
                      Screened windows, climate control, indoor private bathrooms, and guaranteed mutual buddy placements.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-stone-100 text-xs font-bold text-stone-500">
                    10 Campers + 2 Counselors / Cabin
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. SOFTWARE PLATFORM & DIRECTOR TEARDOWN */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto double-bezel-outer p-2">
          <div className="double-bezel-inner p-8 sm:p-14 bg-gradient-to-br from-forest-950 via-stone-900 to-forest-900 text-white rounded-[calc(2.25rem-0.5rem)] space-y-8">
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <span className="eyebrow-pill bg-white/15 text-amber-300 border border-white/20">
                  BUILT ON CAMPERROSTER OS
                </span>
                <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white leading-tight">
                  The modern registration software camps actually love.
                </h2>
                <p className="text-sm text-stone-200 leading-relaxed">
                  Legacy systems like UltraCamp charge up to $975/month even in winter when camps are closed. CamperRoster delivers zero off-season fees, 2-minute AI voice reference checks via KaiCalls, and instant mobile card scanning.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full lg:w-auto">
                <Link
                  href="/ultracamp-alternative"
                  className="px-6 py-3.5 rounded-full bg-white text-stone-950 hover:bg-stone-100 font-extrabold text-xs shadow-md transition-all text-center"
                >
                  UltraCamp Comparison →
                </Link>
                <Link
                  href="/admin"
                  className="px-6 py-3.5 rounded-full bg-forest-800 hover:bg-forest-700 text-white font-extrabold text-xs border border-forest-600 transition-all text-center"
                >
                  Explore Director Hub
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 text-xs">
              <div className="space-y-2">
                <b className="text-amber-400 font-mono text-sm block">$0 Off-Season Retainer</b>
                <p className="text-stone-300">Never pay monthly fees during the 7 months your camp is closed.</p>
              </div>
              <div className="space-y-2">
                <b className="text-emerald-400 font-mono text-sm block">KaiCalls Voice Intelligence</b>
                <p className="text-stone-300">Automated 2-minute phone interviews replace weeks of volunteer reference phone tag.</p>
              </div>
              <div className="space-y-2">
                <b className="text-sky-400 font-mono text-sm block">1-Tap SMS Magic Links</b>
                <p className="text-stone-300">Parents finish incomplete health forms from their phones with zero passwords.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. PARENT FAQS ACCORDION */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <span className="eyebrow-pill bg-stone-100 text-stone-800 border border-stone-200">
              PARENT QUESTIONS
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-stone-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="double-bezel-outer p-1">
                  <div className="double-bezel-inner overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-6 text-left flex items-center justify-between gap-4 font-display font-extrabold text-base text-stone-900 hover:text-forest-800 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-forest-800" : "text-stone-400"}`} />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 animate-in fade-in duration-300">
                        {faq.a}
                      </div>
                    )}
                  </div>
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

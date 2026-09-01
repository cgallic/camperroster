"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight, CheckCircle2 } from "lucide-react";

interface TenantData {
  name: string;
  location: string;
  director: string;
  tagline: string;
  heroImage: string;
  sessions: { name: string; grades: string; dates: string; price: string; spots: number }[];
}

const TENANTS: Record<string, TenantData> = {
  camphope: {
    name: "Camp Hope",
    location: "Lancaster, PA",
    director: "Pastor Dave Miller",
    tagline: "Where lifelong friendships and faith take root on the lakefront.",
    heroImage: "/images/camp_hero.jpg",
    sessions: [
      { name: "Junior Camp", grades: "Grades 2–4", dates: "July 11–17, 2027", price: "$650 ($100 deposit)", spots: 8 },
      { name: "Intermediate Camp", grades: "Grades 5–6", dates: "July 18–24, 2027", price: "$650 ($100 deposit)", spots: 14 },
      { name: "Senior Teen Camp", grades: "Grades 7–8", dates: "July 25–31, 2027", price: "$675 ($100 deposit)", spots: 6 }
    ]
  },
  pinetrail: {
    name: "Pine Trail Youth Camp",
    location: "Adirondacks, NY",
    director: "Sarah Jenkins",
    tagline: "High-adventure wilderness trekking, ropes course, and mountain worship.",
    heroImage: "/images/camp_cabin.jpg",
    sessions: [
      { name: "Wilderness Explorers", grades: "Grades 4–6", dates: "July 12–18, 2027", price: "$700 ($100 deposit)", spots: 12 },
      { name: "Mountain Summit Teen", grades: "Grades 7–9", dates: "July 19–25, 2027", price: "$750 ($100 deposit)", spots: 9 }
    ]
  },
  evergreen: {
    name: "Evergreen Retreat Center",
    location: "Cascade Mountains, WA",
    director: "Mark Henderson",
    tagline: "Peaceful forest cabin fellowship, archery, and lake kayaking.",
    heroImage: "/images/camp_campfire.jpg",
    sessions: [
      { name: "Forest Pioneer Camp", grades: "Grades 3–5", dates: "July 5–11, 2027", price: "$625 ($100 deposit)", spots: 15 },
      { name: "Cascade Leadership Camp", grades: "Grades 6–8", dates: "July 12–18, 2027", price: "$675 ($100 deposit)", spots: 10 }
    ]
  }
};

export default function DynamicTenantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const tenant = TENANTS[slug.toLowerCase()] || TENANTS.camphope;

  return (
    <main className="space-y-12 sm:space-y-20 pb-20">
      
      {/* TENANT BRANDED HERO */}
      <section className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative min-h-[500px] flex flex-col justify-between p-6 sm:p-12 border-2 border-stone-800 shadow-2xl bg-stone-950">
          <Image
            src={tenant.heroImage}
            alt={tenant.name}
            fill
            priority
            className="object-cover opacity-35 filter brightness-90"
          />

          {/* TOP PILLS */}
          <div className="relative z-10 flex flex-wrap items-center gap-2">
            <span className="bg-amber-400 text-stone-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md">
              SUMMER 2027 REGISTRATION
            </span>
            <span className="bg-emerald-400 text-stone-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SPOTS AVAILABLE</span>
            </span>
            <span className="text-xs font-mono font-bold text-stone-300 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-xs">
              Powered by CamperRoster OS
            </span>
          </div>

          {/* TITLE & CALL TO ACTION */}
          <div className="relative z-10 max-w-2xl space-y-4 pt-12">
            <span className="text-amber-300 font-mono text-xs font-bold tracking-widest uppercase block">
              {tenant.location} • Director: {tenant.director}
            </span>
            <h1 className="font-display font-black text-3xl sm:text-6xl text-white tracking-tight leading-tight drop-shadow-md">
              {tenant.name}
            </h1>
            <p className="text-base sm:text-xl text-stone-200 font-medium leading-relaxed drop-shadow-sm">
              {tenant.tagline}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/register?camp=${slug}`}
                className="px-8 py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-98 transition-transform"
              >
                <span>Register a Camper ($100 Deposit)</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>
              <Link
                href={`/portal?camp=${slug}`}
                className="px-6 py-4 rounded-xl bg-stone-900/90 hover:bg-stone-900 text-white font-bold text-xs sm:text-sm border border-stone-700 flex items-center justify-center gap-2 backdrop-blur-xs"
              >
                <span>Parent Household Portal →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SESSIONS GRID */}
      <section className="px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-forest-800 bg-forest-100 px-3 py-1 rounded-full">
            AVAILABLE SESSIONS
          </span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Choose Your Week at {tenant.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tenant.sessions.map((s, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-md space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="bg-amber-100 text-amber-950 px-2.5 py-1 rounded-md">{s.grades}</span>
                  <span className="text-emerald-800 font-mono">{s.spots} Spots Left</span>
                </div>
                <h3 className="font-display font-black text-xl text-stone-950">{s.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold">
                  <Calendar className="w-4 h-4 text-forest-800" />
                  <span>{s.dates}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 space-y-3">
                <b className="font-display font-black text-2xl text-stone-950 block">{s.price}</b>
                <Link
                  href={`/register?camp=${slug}&session=${encodeURIComponent(s.name)}`}
                  className="w-full py-3.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-black text-xs text-center block"
                >
                  Reserve Spot ($100 Deposit) →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Sparkles,
  Gift
} from "lucide-react";

export default function PricingAndRoiPage() {
  const [camperCount, setCamperCount] = useState(350);
  const [staffCount, setStaffCount] = useState(30);
  const [currentSoftware, setCurrentSoftware] = useState<"ultracamp" | "campbrain" | "google_forms">("ultracamp");

  // Competitor Calculations
  let competitorAnnualCost = 0;
  let competitorSetupFee = 0;
  let competitorName = "";

  if (currentSoftware === "ultracamp") {
    competitorName = "UltraCamp";
    // $475/mo retainer year-round ($5,700) + $3/camper ($1,050) + CampDoc medical add-on ($1,200) + Bunk1 ($800) = ~$8,750
    competitorAnnualCost = 5700 + camperCount * 3 + 1200 + 800;
    competitorSetupFee = 1500;
  } else if (currentSoftware === "campbrain") {
    competitorName = "CampBrain";
    // $6,500 annual base + modules
    competitorAnnualCost = 6500 + camperCount * 4 + 1500;
    competitorSetupFee = 3500;
  } else {
    competitorName = "Google Forms + Spreadsheets";
    // Hidden labor cost: 120 hours of manual data entry, reconciliation, and phone tag at $25/hr = $3,000 + lost medical forms
    competitorAnnualCost = 3000 + camperCount * 2;
    competitorSetupFee = 0;
  }

  // CamperRoster Pro Cost: $0 off-season retainer + $6 per camper registration (all-inclusive)
  const camperrosterAnnualCost = camperCount * 6;
  const camperrosterSetupFee = 0;

  const dollarSavings = competitorAnnualCost - camperrosterAnnualCost;
  const hoursSaved = Math.round((staffCount * 3 * 15) / 60); // 3 references per staff, 15 min phone tag each = hours saved

  return (
    <main className="space-y-16 sm:space-y-24 pb-24">
      
      {/* 1. HERO & POSITIONING */}
      <section className="pt-6 sm:pt-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="eyebrow-pill bg-emerald-100 text-emerald-950 border border-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
            <span>THE $0 OFF-SEASON RETAINER GUARANTEE</span>
          </span>
          <h1 className="font-display font-black text-3xl sm:text-6xl text-stone-950 tracking-tight">
            Pay only when campers register. <span className="text-forest-800">$0/month in winter.</span>
          </h1>
          <p className="text-sm sm:text-xl text-stone-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Eliminate the $6,000+ annual software tax. Get automated KaiCalls voice references, health lodge eMAR, and parent bunk notes in one transparent platform.
          </p>
        </div>
      </section>

      {/* 2. INTERACTIVE ROI & SAVINGS SIMULATOR */}
      <section className="px-3 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl p-6 sm:p-12 border-2 border-stone-300 shadow-2xl space-y-8 sm:space-y-10">
          
          <div className="border-b-2 border-stone-200 pb-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full">
                INTERACTIVE COST SIMULATOR
              </span>
              <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950 mt-2">
                Simulate Your Camp&apos;s Annual Savings
              </h2>
            </div>
            <span className="text-xs sm:text-sm font-bold text-stone-500 mt-2 sm:mt-0 block">
              Based on real CCCA camp benchmarks
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* CONTROLS (SLIDERS) */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Selector: Current Software */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-stone-800">Your Current System</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentSoftware("ultracamp")}
                    className={`p-3 rounded-xl border-2 text-xs font-black transition-all cursor-pointer ${
                      currentSoftware === "ultracamp" ? "border-forest-900 bg-forest-50 text-forest-950 shadow-xs" : "border-stone-200 text-stone-700 bg-white"
                    }`}
                  >
                    UltraCamp
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSoftware("campbrain")}
                    className={`p-3 rounded-xl border-2 text-xs font-black transition-all cursor-pointer ${
                      currentSoftware === "campbrain" ? "border-forest-900 bg-forest-50 text-forest-950 shadow-xs" : "border-stone-200 text-stone-700 bg-white"
                    }`}
                  >
                    CampBrain
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSoftware("google_forms")}
                    className={`p-3 rounded-xl border-2 text-xs font-black transition-all cursor-pointer ${
                      currentSoftware === "google_forms" ? "border-forest-900 bg-forest-50 text-forest-950 shadow-xs" : "border-stone-200 text-stone-700 bg-white"
                    }`}
                  >
                    Google Forms
                  </button>
                </div>
              </div>

              {/* Slider 1: Camper Count */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                  <span className="text-stone-800">Annual Registered Campers</span>
                  <span className="font-display font-black text-lg text-forest-900 bg-forest-100 px-3 py-0.5 rounded-lg">
                    {camperCount} campers
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={camperCount}
                  onChange={(e) => setCamperCount(Number(e.target.value))}
                  className="w-full accent-forest-900 h-2 bg-stone-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-bold text-stone-400">
                  <span>50 (Small Church Camp)</span>
                  <span>750 (Mid-Sized)</span>
                  <span>1,500+ (Large)</span>
                </div>
              </div>

              {/* Slider 2: Seasonal Staff / Volunteers */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                  <span className="text-stone-800">Seasonal Counselors & Volunteers</span>
                  <span className="font-display font-black text-lg text-amber-900 bg-amber-100 px-3 py-0.5 rounded-lg">
                    {staffCount} staff
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={staffCount}
                  onChange={(e) => setStaffCount(Number(e.target.value))}
                  className="w-full accent-amber-600 h-2 bg-stone-200 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] text-stone-500 block font-medium">
                  Requires {staffCount * 3} reference checks (3 per applicant)
                </span>
              </div>

            </div>

            {/* RESULTS BOX (HIGH IMPACT SAVINGS CARD) */}
            <div className="lg:col-span-6 bg-stone-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border-2 border-stone-700">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  YOUR ESTIMATED SAVINGS
                </span>
                <span className="text-xs text-stone-300 font-bold bg-white/10 px-2.5 py-1 rounded-full">
                  100% Guaranteed
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-stone-300 font-bold block">Annual Cash Saved</span>
                  <b className="font-display font-black text-3xl sm:text-4xl text-emerald-400 block">
                    ${Math.max(dollarSavings, 500).toLocaleString()}
                  </b>
                  <span className="text-[11px] text-stone-400 block">vs {competitorName}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-stone-300 font-bold block">Staff Hours Reclaimed</span>
                  <b className="font-display font-black text-3xl sm:text-4xl text-amber-400 block">
                    {hoursSaved} hrs
                  </b>
                  <span className="text-[11px] text-stone-400 block">From automated voice AI</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/10 text-xs text-stone-300 font-medium">
                <div className="flex justify-between">
                  <span>{competitorName} Annual Estimate:</span>
                  <span className="font-bold line-through text-rose-400">${competitorAnnualCost.toLocaleString()}/yr</span>
                </div>
                <div className="flex justify-between">
                  <span>CamperRoster Pro All-Inclusive:</span>
                  <span className="font-bold text-emerald-400">${camperrosterAnnualCost.toLocaleString()}/yr ($0 off-season)</span>
                </div>
                <div className="flex justify-between">
                  <span>Setup / Onboarding Fee:</span>
                  <span className="font-bold text-emerald-400">$0 (Save ${competitorSetupFee.toLocaleString()})</span>
                </div>
              </div>

              <Link
                href="/start"
                className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98"
              >
                <span>Claim Your UltraCamp Switcher Offer</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>

            </div>

          </div>
        </div>
      </section>

      {/* 3. THE GRAND SLAM OFFERS (3 SIMPLE TIERS) */}
      <section className="px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="eyebrow-pill bg-forest-100 text-forest-900 border border-forest-200">
              TRANSPARENT PACKAGING
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-stone-950">
              Simple, Predictable Pricing
            </h2>
            <p className="text-sm sm:text-base text-stone-600 font-medium">
              No contracts, no winter retainers, and zero setup fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* TIER 1: STARTER */}
            <div className="bg-white rounded-3xl p-8 border-2 border-stone-200 shadow-md space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold uppercase text-stone-500 tracking-wider">STARTER</span>
                  <h3 className="font-display font-black text-2xl text-stone-950">Pay-As-You-Go</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Perfect for small church retreats and weekend camps upgrading from Google Forms.
                  </p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-black text-4xl text-stone-950">$4.00</span>
                    <span className="text-xs font-bold text-stone-500">/ registered camper</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md inline-block mt-1">
                    $0/month in the off-season
                  </span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-stone-100 text-xs font-bold text-stone-700">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 5-Step Camper Registration Wizard</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 1-Tap SMS Magic Links</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Flexible Installment Schedules</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Director Command Center</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Standard 2.5% + $1.50 Card Processing</li>
                </ul>
              </div>

              <Link href="/start" className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-stone-950 text-white font-extrabold text-xs text-center">
                Get Started Free →
              </Link>
            </div>

            {/* TIER 2: PRO (MOST POPULAR) */}
            <div className="bg-stone-950 text-white rounded-3xl p-8 border-2 border-emerald-400 shadow-2xl space-y-6 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-stone-950 font-black text-[11px] uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                MOST POPULAR • ULTRACAMP KILLER
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold uppercase text-amber-300 tracking-wider">PRO OPERATIONS</span>
                  <h3 className="font-display font-black text-2xl text-white">All-In-One Camp OS</h3>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    The complete operational replacement for UltraCamp, CampDoc, Square, and Bunk1.
                  </p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-black text-4xl text-white">$6.00</span>
                    <span className="text-xs font-bold text-stone-400">/ registered camper</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-md inline-block mt-1">
                    $0/month in the off-season
                  </span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-white/10 text-xs font-bold text-stone-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Everything in Starter</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> <b>KaiCalls AI Voice Reference Calling</b></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-sky-400" /> <b>Health Lodge eMAR Dispenser</b></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> <b>Cashless Canteen POS Register</b></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> <b>Parent Bunk Notes & Daily Photos</b></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> <b>45-Second Express Gate QR Check-In</b></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> <b>1-Click UltraCamp Data Migration</b></li>
                </ul>
              </div>

              <Link href="/start" className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm text-center shadow-lg active:scale-98">
                Switch to Pro ($0 Setup) →
              </Link>
            </div>

            {/* TIER 3: ENTERPRISE / MULTI-CAMP */}
            <div className="bg-white rounded-3xl p-8 border-2 border-stone-200 shadow-md space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold uppercase text-stone-500 tracking-wider">NETWORK</span>
                  <h3 className="font-display font-black text-2xl text-stone-950">Multi-Camp Network</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    For denominations, diocese networks, and multi-location camp organizations.
                  </p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-black text-3xl text-stone-950">Custom Volume</span>
                  </div>
                  <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-md inline-block mt-1">
                    Volume rate discounts for 1,500+ campers
                  </span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-stone-100 text-xs font-bold text-stone-700">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Everything in Pro</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Custom Domain & Branding</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Multi-Tenant Centralized Reporting</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Dedicated Account Manager & Migration</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Custom QuickBooks & Accounting Sync</li>
                </ul>
              </div>

              <a href="mailto:director@camperroster.com?subject=Enterprise%20Multi-Camp%20Inquiry" className="w-full py-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-extrabold text-xs text-center">
                Contact Sales →
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 4. THE ULTRACAMP SWITCHER GRAND SLAM OFFER */}
      <section className="px-3 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-3xl bg-amber-50 border-2 border-amber-300 p-8 sm:p-12 space-y-6 shadow-md">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-amber-700" />
            <div>
              <span className="font-mono text-xs font-bold uppercase text-amber-900 tracking-wider block">
                SPECIAL SWITCHER PACKAGE
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-stone-950">
                The 2027 UltraCamp Switcher Guarantee
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm font-bold text-stone-800">
            <div className="p-4 rounded-xl bg-white border border-amber-200 flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <b>$0 Data Migration Guarantee</b>: We import all your past UltraCamp family records, medical histories, and rosters for free in 60 seconds.
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-amber-200 flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <b>50 Free KaiCalls Voice References</b>: 50 automated phone reference interviews placed and transcribed on us.
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-amber-200 flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <b>100% Opening Day Readiness Guarantee</b>: If your staff isn&apos;t 100% trained and ready by opening day, your first session is on us.
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-amber-200 flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <b>Zero Winter Retainers</b>: You will never receive a bill in November, December, January, or February. Ever.
              </div>
            </div>
          </div>

          <div className="pt-2 text-center sm:text-left">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-stone-950 hover:bg-stone-900 text-white font-black text-sm shadow-md"
            >
              <span>Switch to CamperRoster Today ($0 Setup)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}

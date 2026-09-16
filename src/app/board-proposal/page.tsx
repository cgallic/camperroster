"use client";

import Link from "next/link";
import { Printer } from "lucide-react";

export default function BoardProposalPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8 print:p-0 print:max-w-full">
      
      {/* NO-PRINT CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-900 text-white shadow-lg print:hidden">
        <div className="space-y-1">
          <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest">
            SAMPLE ONE-PAGER • FILL IN YOUR OWN NUMBERS
          </span>
          <h2 className="font-display font-black text-lg text-white">Board Proposal Template</h2>
          <p className="text-[11px] text-stone-300 leading-relaxed max-w-xl">
            A one-page briefing you can print and take to your board. It is filled in with our
            sample camp and our own cost estimates &mdash; swap in your camp&apos;s real figures before you use it.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
          <Link href="/admin" className="px-4 py-2.5 rounded-full bg-stone-800 text-stone-300 font-bold text-xs hover:bg-stone-700">
            ← Director Hub
          </Link>
        </div>
      </div>

      {/* 8.5x11 PRINTABLE EXECUTIVE ONE-PAGER */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-stone-300 shadow-xl space-y-8 print:border-none print:shadow-none print:p-0 text-stone-900">
        
        {/* HEADER */}
        <div className="border-b-2 border-stone-200 pb-6 flex justify-between items-start">
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-forest-800 bg-forest-100 px-3 py-1 rounded-full">
EXAMPLE BRIEFING • PREPARED FOR YOUR BOARD
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-stone-950 tracking-tight">
              Camp Hope 2027: Platform Modernization & Cost Reduction
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 font-medium max-w-xl">
An example evaluation of moving a camp off fragmented legacy tools (UltraCamp, spreadsheets, paper health forms) onto CamperRoster. Camp Hope is our sample camp; the figures below are our estimates, not a customer&apos;s results.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <b className="font-display font-black text-2xl text-forest-950 block">CamperRoster</b>
            <span className="text-xs text-stone-500 block">Summer 2027 Season</span>
          </div>
        </div>

        {/* 1. THE PROBLEM */}
        <div className="space-y-3">
          <h3 className="font-display font-black text-lg text-stone-950 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-mono text-xs flex items-center justify-center font-bold">1</span>
            <span>The Challenge: Fragmented Software & Hidden Staff Burden</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <b className="font-bold text-rose-900 block">The &quot;Winter Tax&quot;</b>
              <p className="text-stone-600 leading-relaxed">
                Paying $350–$650/month in software retainers during off-season months (Nov–March) when zero campers are registering.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <b className="font-bold text-rose-900 block">40+ Hours of Phone Tag</b>
              <p className="text-stone-600 leading-relaxed">
                Directors manually calling 90+ pastoral and mentor references for volunteer staff during busy spring months.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <b className="font-bold text-rose-900 block">Opening Day Bottlenecks</b>
              <p className="text-stone-600 leading-relaxed">
                Parents arriving with incomplete paper immunization forms, causing 30-minute drop-off vehicle queues in the summer heat.
              </p>
            </div>
          </div>
        </div>

        {/* 2. THE FINANCIAL COMPARISON (BOARD TABLE) */}
        <div className="space-y-3">
          <h3 className="font-display font-black text-lg text-stone-950 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs flex items-center justify-center font-bold">2</span>
            <span>Annual Financial Impact (Based on 350 Campers & 30 Staff)</span>
          </h3>
          <div className="overflow-x-auto border-2 border-stone-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200">
                <tr>
                  <th className="p-3.5">Budget Category</th>
                  <th className="p-3.5">Legacy Setup (UltraCamp + Add-ons)</th>
                  <th className="p-3.5 bg-emerald-50 text-emerald-950">CamperRoster Pro OS</th>
                  <th className="p-3.5 text-emerald-800">Camp Hope Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-stone-800">
                <tr>
                  <td className="p-3.5 font-bold">Off-Season Monthly Retainers</td>
                  <td className="p-3.5 text-stone-600">$4,200 ($475/mo × 9 mos)</td>
                  <td className="p-3.5 bg-emerald-50/50 font-bold text-emerald-900">$0.00 (Guaranteed)</td>
                  <td className="p-3.5 font-black text-emerald-700">Save $4,200</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold">Camper Registration Fees</td>
                  <td className="p-3.5 text-stone-600">$1,050 ($3.00/camper)</td>
                  <td className="p-3.5 bg-emerald-50/50 font-bold text-emerald-900">$2,100 ($6.00/camper)</td>
                  <td className="p-3.5 text-stone-500">All-Inclusive</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold">Staff Volunteer Reference Calling</td>
                  <td className="p-3.5 text-stone-600">40 hrs staff labor (~$1,000)</td>
                  <td className="p-3.5 bg-emerald-50/50 font-bold text-emerald-900">Included (KaiCalls Voice AI)</td>
                  <td className="p-3.5 font-black text-emerald-700">Save 40 Hours</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold">Medical eMAR & Health Records</td>
                  <td className="p-3.5 text-stone-600">$1,200/yr (CampDoc add-on)</td>
                  <td className="p-3.5 bg-emerald-50/50 font-bold text-emerald-900">Included Native</td>
                  <td className="p-3.5 font-black text-emerald-700">Save $1,200</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold">Parent Daily Bunk Notes Mail</td>
                  <td className="p-3.5 text-stone-600">$800/yr (Bunk1 add-on)</td>
                  <td className="p-3.5 bg-emerald-50/50 font-bold text-emerald-900">Included Native</td>
                  <td className="p-3.5 font-black text-emerald-700">Save $800</td>
                </tr>
                <tr className="bg-stone-50 font-black text-sm">
                  <td className="p-3.5">TOTAL ESTIMATED ANNUAL COST</td>
                  <td className="p-3.5 text-rose-800">$8,250 / year</td>
                  <td className="p-3.5 bg-emerald-100 text-emerald-950 font-black">$2,100 / year</td>
                  <td className="p-3.5 text-emerald-800 font-black">SAVE $6,150 / YR (74%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. CORE OPERATIONAL GAINS */}
        <div className="space-y-3">
          <h3 className="font-display font-black text-lg text-stone-950 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 font-mono text-xs flex items-center justify-center font-bold">3</span>
            <span>Operational & Safety Improvements for Camp Hope 2027</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl border border-stone-200 space-y-1">
              <b className="text-stone-950 block">⚡ 45-Second Express Gate Check-In</b>
              <p className="text-stone-600 leading-relaxed">
                Parents present an SVG Boarding Pass QR on their phone. Gate staff scan to instantly verify RN health clearance, assigned cabin (*Cabin 4 • Timber Lodge*), and hand out canteen wristbands.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-stone-200 space-y-1">
              <b className="text-stone-950 block">🎙️ Automated KaiCalls Voice References</b>
              <p className="text-stone-600 leading-relaxed">
In development: the voice assistant dials mentors and pastors, runs a 2-minute structured interview, and files the recording and transcript against the applicant. Until it ships, references are reviewed by hand in the director dashboard.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-stone-200 space-y-1">
              <b className="text-stone-950 block">💊 Health Lodge Tablet eMAR</b>
              <p className="text-stone-600 leading-relaxed">
                Camp nurses log prescription dosages (Breakfast, Lunch, Dinner, Bedtime) with timestamped records compliant with ACA and HIPAA guidelines.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-stone-200 space-y-1">
              <b className="text-stone-950 block">📱 1-Tap SMS Magic Links</b>
              <p className="text-stone-600 leading-relaxed">
In development: no more forgotten parent passwords &mdash; a one-tap link to finish missing immunization cards and photo uploads.
              </p>
            </div>
          </div>
        </div>

        {/* 4. RECOMMENDATION & SIGN-OFF */}
        <div className="p-5 rounded-2xl bg-forest-950 text-white space-y-2">
          <div className="flex items-center justify-between">
            <b className="text-sm font-black text-emerald-400">RECOMMENDATION: ADOPT CAMPERROSTER FOR SUMMER 2027</b>
            <span className="font-mono text-xs font-bold bg-white/10 px-3 py-1 rounded-full text-stone-200">$0 Setup & Migration</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
On these example figures, a camp this size would save roughly <b>$6,150 a year</b> and reclaim <b>40+ hours of director time</b>, while giving families a registration flow that works on a phone. Run the numbers for your own camp on the pricing page before you present this.
          </p>
        </div>

      </div>

    </main>
  );
}

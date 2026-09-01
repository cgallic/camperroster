import Link from "next/link";
import { Trees, ShieldCheck, Heart, ArrowUpRight, PhoneCall } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-forest-950 text-stone-300 pt-20 pb-12 px-4 sm:px-8 lg:px-12 border-t border-forest-900">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* 5-COLUMN SITEMAP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          
          {/* COL 1: BRAND & MISSION */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-forest-800 text-white flex items-center justify-center shadow-md">
                <Trees className="w-6 h-6 text-emerald-300" />
              </div>
              <span className="font-display font-black text-2xl text-white tracking-tight">CamperRoster</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-400 max-w-sm leading-relaxed">
              The modern camp registration and operations platform. Built to eliminate parent drop-off, automate staff reference checks with KaiCalls, and guarantee 100% data readiness before opening day.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ACA Standard Compliant • HIPAA-Compliant Medical Triage</span>
            </div>
          </div>

          {/* COL 2: OPERATIONS SUITE */}
          <div className="space-y-4 text-xs">
            <b className="font-mono text-[11px] font-bold uppercase text-stone-400 tracking-wider block">
              Camp Operations
            </b>
            <ul className="space-y-2.5">
              <li><Link href="/register" className="hover:text-white transition-colors">5-Step Camper Registration</Link></li>
              <li><Link href="/portal" className="hover:text-white transition-colors">Parent Household Portal</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors">Director Command Center</Link></li>
              <li><Link href="/nurse/emar" className="hover:text-white transition-colors">Nurse eMAR Health Lodge</Link></li>
              <li><Link href="/canteen/pos" className="hover:text-white transition-colors">Cashless Canteen POS</Link></li>
              <li><Link href="/volunteer" className="hover:text-white transition-colors">Volunteer & Staff Pipeline</Link></li>
            </ul>
          </div>

          {/* COL 3: COMPARISONS & GTM */}
          <div className="space-y-4 text-xs">
            <b className="font-mono text-[11px] font-bold uppercase text-stone-400 tracking-wider block">
              Why Switch
            </b>
            <ul className="space-y-2.5">
              <li><Link href="/ultracamp-alternative" className="text-amber-400 hover:text-amber-300 transition-colors font-semibold">vs UltraCamp ($0 Off-Season)</Link></li>
              <li><Link href="/church-camp-registration-software" className="hover:text-white transition-colors">Church & Faith-Based Camps</Link></li>
              <li><Link href="/camp-registration-software-vs-google-forms" className="hover:text-white transition-colors">vs Google Forms & Venmo</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Transparent Pricing Calculator</Link></li>
            </ul>
          </div>

          {/* COL 4: AI & DEVELOPER PLATFORM */}
          <div className="space-y-4 text-xs">
            <b className="font-mono text-[11px] font-bold uppercase text-stone-400 tracking-wider block">
              AI & MCP Architecture
            </b>
            <ul className="space-y-2.5">
              <li><Link href="/llms.txt" className="hover:text-white transition-colors">/llms.txt (Agent Manifest)</Link></li>
              <li><span className="text-stone-500 font-mono text-[11px]">@camperroster/mcp-server</span></li>
              <li><span className="text-stone-500">KaiCalls Voice Webhooks</span></li>
              <li><Link href="/api/health" className="hover:text-white transition-colors">Live Edge Health Check</Link></li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 border-t border-forest-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>© 2026 CamperRoster Inc. All rights reserved. Flagship client: Camp Hope 2027.</div>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for camp directors worldwide</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

import Link from "next/link";
import { Trees, ShieldCheck, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-forest-950 text-stone-300 pt-20 pb-12 px-4 sm:px-8 lg:px-12 border-t border-forest-900">
      <div className="max-w-7xl mx-auto space-y-16">
        
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
              The modern camp registration and operations platform. Built to eliminate parent drop-off, automate staff reference checks with KaiCalls, and get every record complete before opening day.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Private document storage • Role-based staff access</span>
            </div>
          </div>

          {/* COL 2: OPERATIONS SUITE */}
          <div className="space-y-4 text-xs">
            <b className="font-mono text-[11px] font-bold uppercase text-stone-400 tracking-wider block">
              Camp Operations
            </b>
            <ul className="space-y-2.5">
              <li><Link href="/summer-camp-management-software" className="hover:text-white transition-colors">Summer Camp Management Software</Link></li>
              <li><Link href="/church-camp-registration-software" className="hover:text-white transition-colors">Church Camp Registration Software</Link></li>
              <li><Link href="/christian-camp-software" className="hover:text-white transition-colors">Christian Camp Software</Link></li>
              <li><Link href="/camp-health-records-software" className="hover:text-white transition-colors">Camp Health Records &amp; eMAR</Link></li>
              <li><Link href="/cashless-camp-canteen-pos" className="hover:text-white transition-colors">Camp POS &amp; Cashless Canteen</Link></li>
              <li><Link href="/camp-volunteer-reference-check-software" className="hover:text-white transition-colors">Volunteer Reference Checks</Link></li>
              <li><Link href="/portal" rel="nofollow" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">Parent Portal Sign-In</Link></li>
            </ul>
          </div>

          {/* COL 3: WHY SWITCH */}
          <div className="space-y-4 text-xs">
            <b className="font-mono text-[11px] font-bold uppercase text-stone-400 tracking-wider block">
              Why Switch
            </b>
            <ul className="space-y-2.5">
              <li><Link href="/ultracamp-alternative" className="text-amber-400 hover:text-amber-300 transition-colors font-semibold">vs UltraCamp ($0 Off-Season)</Link></li>
              <li><Link href="/campdoc-alternative" className="hover:text-white transition-colors">vs CampDoc</Link></li>
              <li><Link href="/campminder-alternative" className="hover:text-white transition-colors">vs CampMinder</Link></li>
              <li><Link href="/campbrain-alternative" className="hover:text-white transition-colors">vs CampBrain</Link></li>
              <li><Link href="/camp-registration-software-vs-google-forms" className="hover:text-white transition-colors">vs Google Forms & Venmo</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Transparent Pricing</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Camp Operations Guides</Link></li>
              <li><Link href="/start" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">Launch Your Camp ($0 Setup)</Link></li>
            </ul>
          </div>

          {/* COL 4: AI & DEVELOPER PLATFORM */}
          <div className="space-y-4 text-xs">
            <b className="font-mono text-[11px] font-bold uppercase text-stone-400 tracking-wider block">
              AI & Developer Platform
            </b>
            <ul className="space-y-2.5">
              <li><Link href="/llms.txt" className="hover:text-white transition-colors">/llms.txt (Agent Manifest)</Link></li>
              <li><span className="text-stone-500 font-mono text-[11px]">@camperroster/mcp-server</span></li>
              <li><Link href="/volunteer" className="hover:text-white transition-colors">Volunteer Application Form</Link></li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 border-t border-forest-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex flex-wrap items-center gap-3"><span>© 2026 CamperRoster. All rights reserved.</span><Link href="/privacy" className="hover:text-white underline">Privacy</Link><Link href="/terms" className="hover:text-white underline">Terms</Link></div>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for camp directors & families</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

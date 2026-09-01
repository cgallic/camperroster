"use client";

import Link from "next/link";
import { useState } from "react";
import { Trees, PhoneCall, ArrowUpRight, Menu, X } from "lucide-react";
import KaiCallsSimulatorModal from "./KaiCallsSimulatorModal";

export default function Navbar() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 lg:px-12 pt-4 pb-2 bg-stone-100/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto bg-white border-2 border-stone-300 rounded-full px-6 sm:px-10 py-3.5 flex items-center justify-between shadow-md">
          
          {/* BRAND */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-2xl bg-forest-950 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Trees className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xl tracking-tight text-stone-950">CamperRoster</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  OS
                </span>
              </div>
              <span className="text-xs text-stone-600 font-bold hidden sm:block">Modern Camp Software</span>
            </div>
          </Link>

          {/* CLEAN SPACIOUS NAVIGATION */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-extrabold text-stone-900">
            <Link href="/" className="hover:text-forest-900 transition-colors">
              Platform
            </Link>
            <Link href="/pricing" className="hover:text-forest-900 transition-colors">
              Pricing
            </Link>
            <Link href="/ultracamp-alternative" className="text-amber-800 hover:text-amber-900 transition-colors flex items-center gap-1.5">
              <span>vs UltraCamp</span>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-950 px-2 py-0.5 rounded-full border border-amber-300">$0 Off-Season</span>
            </Link>
          </nav>

          {/* RIGHT ACTION PILLS */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className="hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold text-xs hover:bg-emerald-200 transition-all cursor-pointer shadow-xs"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <PhoneCall className="w-4 h-4 text-emerald-900" />
              <span>KaiCalls Voice AI</span>
            </button>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-forest-900 hover:bg-forest-950 text-white font-black text-xs shadow-md transition-all hover:scale-102"
            >
              <span>Get Started</span>
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-900 hover:bg-stone-100 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-6 bg-white rounded-3xl space-y-4 border-2 border-stone-300 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-stone-950">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="p-3.5 rounded-xl bg-stone-100 hover:bg-stone-200">Platform Overview</Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="p-3.5 rounded-xl bg-stone-100 hover:bg-stone-200">Pricing</Link>
              <Link href="/ultracamp-alternative" onClick={() => setMobileMenuOpen(false)} className="p-3.5 rounded-xl bg-amber-100 text-amber-950 font-black">vs UltraCamp</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="p-3.5 rounded-xl bg-forest-100 text-forest-950 font-black">Camp Hope Demo</Link>
              <Link href="/portal" onClick={() => setMobileMenuOpen(false)} className="p-3.5 rounded-xl bg-stone-100 hover:bg-stone-200">Parent Portal</Link>
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="p-3.5 rounded-xl bg-stone-100 hover:bg-stone-200">Director Hub</Link>
            </div>
            <button
              onClick={() => { setMobileMenuOpen(false); setModalOpen(true); }}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Launch KaiCalls AI Voice Demo</span>
            </button>
          </div>
        )}
      </header>

      <KaiCallsSimulatorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

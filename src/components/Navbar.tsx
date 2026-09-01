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
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 lg:px-12 pt-6 pb-2">
        <div className="max-w-7xl mx-auto glass-island rounded-full px-6 sm:px-10 py-4 flex items-center justify-between transition-all">
          
          {/* BRAND */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-2xl bg-forest-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Trees className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xl tracking-tight text-stone-900">CamperRoster</span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  OS
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium hidden sm:block">Modern Camp Software</span>
            </div>
          </Link>

          {/* CLEAN SPACIOUS NAVIGATION (ONLY 3 CORE LINKS) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-extrabold text-stone-600">
            <Link href="/" className="hover:text-stone-950 transition-colors">
              Platform
            </Link>
            <Link href="/pricing" className="hover:text-stone-950 transition-colors">
              Pricing
            </Link>
            <Link href="/ultracamp-alternative" className="text-sun-600 hover:text-sun-700 transition-colors flex items-center gap-1">
              <span>vs UltraCamp</span>
              <span className="text-[10px] font-mono font-bold bg-sun-100 text-sun-800 px-2 py-0.5 rounded-full">$0 Off-Season</span>
            </Link>
          </nav>

          {/* RIGHT ACTION PILLS */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className="hidden lg:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs hover:bg-emerald-100 hover:scale-102 transition-all cursor-pointer shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
              <span>KaiCalls Voice AI</span>
            </button>

            <Link
              href="/register"
              className="btn-primary-agency text-xs py-3 px-6 group"
            >
              <span>Get Started</span>
              <span className="btn-icon-circle w-6 h-6">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-6 glass-island rounded-3xl space-y-4 border border-stone-200 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-stone-800">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100">Platform Overview</Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100">Pricing ($0 Off-Season)</Link>
              <Link href="/ultracamp-alternative" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-xl bg-sun-50 text-sun-700 font-bold">vs UltraCamp</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-xl bg-forest-50 text-forest-900 font-bold">Camp Hope Demo</Link>
              <Link href="/portal" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100">Parent Portal</Link>
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100">Director Hub</Link>
            </div>
            <button
              onClick={() => { setMobileMenuOpen(false); setModalOpen(true); }}
              className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2"
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

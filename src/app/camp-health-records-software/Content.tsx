"use client";

import { useState } from "react";
import Link from "next/link";
import ProductShot from "@/components/ProductShot";
import FaqJsonLd from "@/components/FaqJsonLd";
import { Sparkles, ArrowRight, ChevronDown, CheckCircle2 } from "lucide-react";

export default function DeepSeoLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "What is a camp electronic health record?",
      a: "A camp electronic health record keeps each camper's health form, allergies, medications, immunization records, physical, and insurance card in one secure place that the health staff can open on a tablet. In CamperRoster parents fill it in during registration, and nurses log medication passes in the Health Lodge eMAR on the same platform."
    },
    {
      q: "Can parents upload immunization records and physical forms during registration?",
      a: "Yes. Parents upload PDFs or take photos with their phone camera inside the registration wizard, using the same login they used to register. There is no separate medical account to create."
    },
    {
      q: "How do waivers and consent forms work?",
      a: "The liability form and emergency treatment waiver are part of registration. Parents sign with a typed-name e-signature, and CamperRoster stores that typed signature with the consent boxes they checked at registration."
    },
    {
      q: "Who can see camper medical information?",
      a: "Medical records are protected with PostgreSQL Row-Level Security, so confidential health files are limited to authorized Health Lodge staff rather than everyone with a staff login."
    },
    {
      q: "Does the Health Lodge eMAR work without Wi-Fi?",
      a: "No. The eMAR needs an internet connection. It runs in the browser over camp Wi-Fi or a phone hotspot, so plan for a signal in the health cabin."
    }
  ];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">

      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>CAMP EHR + HEALTH LODGE eMAR</span>
        </span>

        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-stone-950 tracking-tight leading-[1.1]">
          Camp health records software, built into registration.
        </h1>

        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-3xl mx-auto leading-relaxed">
          Parents fill in health forms, upload immunization records and physicals, and sign waivers in the same registration, with one login. Your nurse logs medication passes in the built-in Health Lodge eMAR, with no second system.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3.5">
          <Link
            href="/start"
            className="px-8 py-4 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-98 transition-transform w-full sm:w-auto"
          >
            <span>Launch Your Camp ($0 Setup)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-sm flex items-center justify-center w-full sm:w-auto"
          >
            <span>See Pricing ($4–$6 per camper) →</span>
          </Link>
        </div>

        <div className="pt-4 flex flex-wrap justify-center items-center gap-6 text-xs font-bold text-stone-500">
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>One parent login for registration and health</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Doses logged by meal window</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No extra per-camper medical fee</span>
          </span>
        </div>
      </section>

      {/* REAL PRODUCT SCREEN */}
      <section className="max-w-5xl mx-auto space-y-4">
        <ProductShot name="emar" alt="Medication log in CamperRoster showing scheduled and administered doses for each camper" caption="The Health Lodge medication log, filled with the demo camp. Doses are grouped by meal time and stamped when given." />
        <p className="text-center text-sm font-bold">
          <Link href="/demo" className="text-forest-900 underline underline-offset-4 hover:text-forest-700">See every screen in the product tour →</Link>
        </p>
      </section>

      {/* 2. THE PROBLEM */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-12 border border-stone-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-rose-800 tracking-wider">THE OLD WAY</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Why camp medical form collection breaks down
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            When health records live in a separate system, or on paper, the gaps show up on opening day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">1</div>
              <h3 className="font-display font-black text-lg text-stone-950">A second login for parents</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Families register in one place and get sent to another site for medical forms. Forgotten passwords turn into incomplete files.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">2</div>
              <h3 className="font-display font-black text-lg text-stone-950">Missing immunizations and physicals</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Staff chase paper forms by email for weeks, and the last ones arrive in the car line on opening Sunday.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">3</div>
              <h3 className="font-display font-black text-lg text-stone-950">Allergy lists retyped by hand</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Someone copies allergies and medications from forms into a nurse binder or spreadsheet, and every copy is a chance for a mistake.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">4</div>
              <h3 className="font-display font-black text-lg text-stone-950">Waivers in a filing cabinet</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Signed liability and treatment waivers sit on paper, so nobody can confirm a camper is cleared without digging through a box.
            </p>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-forest-800 tracking-wider">REGISTRATION TO HEALTH LODGE</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            How camper health records work in CamperRoster
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            One record per camper, collected once, used by the nurse all session.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
            <b className="font-display font-black text-lg text-stone-950 block">📋 Health forms inside registration</b>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Medical history, allergies, medications, and care plans such as EpiPen instructions are part of the registration wizard, not a separate site.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
            <b className="font-display font-black text-lg text-stone-950 block">📷 Immunization, physical, and insurance uploads</b>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Parents upload PDFs or snap phone photos of immunization records, physical forms, and the front and back of their insurance card.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
            <b className="font-display font-black text-lg text-stone-950 block">✍️ Waivers and consent at registration</b>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              The liability form and emergency treatment waiver are signed with a typed-name e-signature. The typed signature and the consent boxes each parent checked are stored with their registration.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
            <b className="font-display font-black text-lg text-stone-950 block">💊 Health Lodge eMAR</b>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Nurses log each camper&apos;s doses on a tablet by meal time (breakfast, lunch, dinner, bedtime) with timestamped records.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
            <b className="font-display font-black text-lg text-stone-950 block">📎 Immunization and insurance uploads</b>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Parents upload immunization records and insurance card photos during registration, and health staff open them from the camper record.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
            <b className="font-display font-black text-lg text-stone-950 block">🔒 Access limited to health staff</b>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              PostgreSQL Row-Level Security restricts confidential medical records to authorized Health Lodge staff.
            </p>
          </div>
        </div>
      </section>

      {/* 4. COMPARISON */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 tracking-wider">SIDE-BY-SIDE</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Separate medical system vs health records inside registration
          </h2>
        </div>

        <div className="overflow-x-auto border-2 border-stone-200 rounded-3xl bg-white shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-900 font-black border-b-2 border-stone-200">
              <tr>
                <th className="p-4 sm:p-5">What you need</th>
                <th className="p-4 sm:p-5 text-stone-600">Registration + separate health tool</th>
                <th className="p-4 sm:p-5 bg-emerald-50 text-emerald-950 font-black">CamperRoster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr>
                <td className="p-4 sm:p-5 font-bold">Parent logins</td>
                <td className="p-4 sm:p-5 text-stone-600">Two accounts</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">One login for registration, forms, and waivers</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Allergy and medication data</td>
                <td className="p-4 sm:p-5 text-stone-600">Exported or retyped between systems</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Same platform as registration and the eMAR</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Medical cost</td>
                <td className="p-4 sm:p-5 text-stone-600">Often a second per-camper fee</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Included in $4–$6 per registered camper</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Opening-day clearance</td>
                <td className="p-4 sm:p-5 text-stone-600">Check two screens</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Same camper record from Health Lodge to gate</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 text-center max-w-3xl mx-auto">
          Replacing a standalone medical tool? Read the <Link href="/campdoc-alternative" className="font-bold text-forest-800 underline">CampDoc alternative</Link> comparison. Looking at the whole platform? See <Link href="/summer-camp-management-software" className="font-bold text-forest-800 underline">summer camp management software</Link> or <Link href="/church-camp-registration-software" className="font-bold text-forest-800 underline">church camp registration software</Link>.
        </p>
      </section>

      {/* 5. GET STARTED */}
      <section className="bg-white rounded-3xl p-6 sm:p-12 border-2 border-stone-300 shadow-xl space-y-8">
        <div className="max-w-3xl space-y-2">
          <span className="eyebrow-pill bg-emerald-100 text-emerald-950 border border-emerald-300">
            RAPID ONBOARDING
          </span>
          <h3 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Collect health records this season in 3 steps
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 1</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Create your camp portal</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Set your sessions at /start. No setup fee.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 2</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Bring over last year&apos;s roster</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Upload a CSV or Excel export and match its columns, including allergies, medications and dietary notes. You check a preview before anything is saved.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 3</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Share your registration link</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Parents register, upload forms, and sign waivers in one pass. Your nurse opens the eMAR on day one.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-4">
          <Link href="/start" className="btn-primary-agency text-xs sm:text-sm py-4 px-8">
            <Sparkles className="w-4 h-4" />
            <span>Launch Your Camp ($0 Setup)</span>
          </Link>
          <Link href="/pricing" className="px-6 py-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm text-center">
            See Pricing →
          </Link>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-stone-500 tracking-wider">FAQ</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          <FaqJsonLd faqs={faqs} />
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden shadow-xs"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 text-left font-black text-sm sm:text-base text-stone-900 flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-stone-500 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
              </button>
              <div hidden={openFaq !== idx} className="p-5 pt-0 text-xs sm:text-sm text-stone-600 font-medium leading-relaxed border-t border-stone-100">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. BOTTOM CTA */}
      <section className="bg-forest-950 text-white rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-2xl border-2 border-emerald-400">
        <span className="eyebrow-pill bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
          ONE LOGIN. ONE HEALTH RECORD.
        </span>
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white">
          Launch your camp portal in 3 minutes.
        </h2>
        <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
          Health records, eMAR, and waivers included. $0 setup, $0 per month off-season, $4–$6 per registered camper.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/start"
            className="px-10 py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-sm shadow-xl active:scale-98 transition-transform"
          >
            Create Camp Portal ($0 Setup) →
          </Link>
        </div>
      </section>

    </main>
  );
}

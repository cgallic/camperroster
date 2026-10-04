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
      q: "Is CamperRoster a good CampMinder alternative for a small camp?",
      a: "CamperRoster is built for small and mid-sized camps: church camps, nonprofit camps, and day and overnight programs that want registration, health records, check-in, and payments without an enterprise rollout. CampMinder is a large, full-featured system aimed at established camps, so if your camp needs every module an enterprise suite offers, compare both carefully."
    },
    {
      q: "How much does CamperRoster cost compared with CampMinder?",
      a: "CamperRoster publishes its price: $4 to $6 per registered camper, $0 per month during the off-season, and $0 setup. CampMinder pricing is quote-based, so the only way to compare is to get a CampMinder quote for your camper count and set it next to the per-camper math on our pricing page."
    },
    {
      q: "Can we move our camper roster from our current system into CamperRoster?",
      a: "Yes. Export your families and campers from CampMinder as a CSV or Excel file, upload it, and match the columns to ours. You check a preview before anything is saved."
    },
    {
      q: "Does CamperRoster include health records and a nurse eMAR?",
      a: "Yes. Health forms, immunization uploads, and medication details are collected during registration, and the Health Lodge eMAR shows scheduled doses by meal window and records who gave each one and when. It needs an internet connection, such as camp Wi-Fi or a phone hotspot."
    },
    {
      q: "Do we need a sales call or a long onboarding project to start?",
      a: "No. You can create your camp portal yourself at /start, set your sessions, and share a registration link with parents. There is no setup fee and nothing to pay in the months you are not running camp."
    }
  ];

  return (
    <main className="space-y-16 sm:space-y-24 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">

      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>FOR CHURCH, NONPROFIT, DAY & OVERNIGHT CAMPS</span>
        </span>

        <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-stone-950 tracking-tight leading-[1.1]">
          The CampMinder alternative for camps that don&apos;t need an enterprise suite.
        </h1>

        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-3xl mx-auto leading-relaxed">
          CampMinder is a large, full-featured system built for established camps, with pricing by quote. If your camp is smaller and wants registration, health records, and check-in running this season, CamperRoster publishes its price: <b>$4–$6 per registered camper, $0/month off-season, $0 setup.</b>
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
            <span>See Published Pricing →</span>
          </Link>
        </div>

        <div className="pt-4 flex flex-wrap justify-center items-center gap-6 text-xs font-bold text-stone-500">
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Price on the website, not in a quote</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>$0/month in the off-season</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Health Lodge eMAR included</span>
          </span>
        </div>
      </section>

      {/* REAL PRODUCT SCREEN */}
      <section className="max-w-5xl mx-auto space-y-4">
        <ProductShot name="admin" alt="CamperRoster director dashboard with registrations, volunteers and review queue" caption="The director dashboard in the demo camp." />
        <p className="text-center text-sm font-bold">
          <Link href="/demo" className="text-forest-900 underline underline-offset-4 hover:text-forest-700">See every screen in the product tour →</Link>
        </p>
      </section>

      {/* 2. WHO THIS IS FOR */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-12 border border-stone-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-rose-800 tracking-wider">RIGHT-SIZED SOFTWARE</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            When a smaller camp outgrows spreadsheets but not into an enterprise suite
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            Most camps looking for a CampMinder alternative are not unhappy with features. They want software sized to a camp run by a few year-round staff and a lot of volunteers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">1</div>
              <h3 className="font-display font-black text-lg text-stone-950">You want to know the price before a sales call</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              If your board needs a number before it approves anything, CamperRoster&apos;s per-camper price is public. Multiply your expected campers by $4–$6 and that is the software line in your budget.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">2</div>
              <h3 className="font-display font-black text-lg text-stone-950">Your camp runs for a few weeks a year</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              If you only run sessions in summer, you pay when campers register and $0 per month the rest of the year.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">3</div>
              <h3 className="font-display font-black text-lg text-stone-950">Your staff and volunteers change every season</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              If counselors need to pick up the cabin roster on their phone with no training session, CamperRoster&apos;s counselor and nurse screens are built for that.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-stone-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-black">4</div>
              <h3 className="font-display font-black text-lg text-stone-950">You need it live this season, not next year</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              If registration opens soon, you can create your portal at /start yourself, send us last year&apos;s roster to move over, and share a registration link the same day.
            </p>
          </div>
        </div>
      </section>

      {/* 3. COMPARISON TABLE */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-emerald-800 tracking-wider">SIDE-BY-SIDE EVALUATION</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            CamperRoster vs a Typical Enterprise Camp Suite
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            A general comparison of approach, not a feature audit of any one vendor. Ask any vendor you evaluate to confirm their current terms.
          </p>
        </div>

        <div className="overflow-x-auto border-2 border-stone-200 rounded-3xl bg-white shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-900 font-black border-b-2 border-stone-200">
              <tr>
                <th className="p-4 sm:p-5">What you are deciding</th>
                <th className="p-4 sm:p-5 text-stone-600">Typical enterprise camp suite</th>
                <th className="p-4 sm:p-5 bg-emerald-50 text-emerald-950 font-black">CamperRoster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr>
                <td className="p-4 sm:p-5 font-bold">Who it is built for</td>
                <td className="p-4 sm:p-5 text-stone-600">Established, often larger camps with full-time admin teams</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Small and mid-sized church, nonprofit, day, and overnight camps</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">How pricing works</td>
                <td className="p-4 sm:p-5 text-stone-600">Quote-based, set with a sales rep</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Published: $4–$6 per registered camper</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Off-season cost</td>
                <td className="p-4 sm:p-5 text-stone-600">Depends on the contract you sign</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">$0/month</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Getting started</td>
                <td className="p-4 sm:p-5 text-stone-600">Demo, quote, and a guided onboarding project</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Self-serve at /start, $0 setup</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Health records and medication logging</td>
                <td className="p-4 sm:p-5 text-stone-600">Varies by package; confirm with the vendor</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Health forms plus Health Lodge eMAR included</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold">Breadth of modules</td>
                <td className="p-4 sm:p-5 text-stone-600">Very broad, suited to complex operations</td>
                <td className="p-4 sm:p-5 bg-emerald-50/50 text-emerald-900 font-black">Focused: registration, health, gate check-in, canteen POS, bunk notes</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 text-center max-w-3xl mx-auto">
          Running a church program? See <Link href="/church-camp-registration-software" className="font-bold text-forest-800 underline">church camp registration software</Link>. Want the full operations view? See <Link href="/summer-camp-management-software" className="font-bold text-forest-800 underline">summer camp management software</Link>.
        </p>
      </section>

      {/* 4. WHAT'S INCLUDED */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="font-mono text-xs font-bold uppercase text-forest-800 tracking-wider">ONE PLATFORM, ONE PRICE</span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            What comes with every CamperRoster camp
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            The parts of camp operations a small team uses every day, included in the per-camper price.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
            <b className="font-display font-black text-lg text-stone-950 block">📝 Mobile Registration Wizard</b>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Parents register, pay deposits or installments, and upload forms from their phone through a shareable link for your camp.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
            <b className="font-display font-black text-lg text-stone-950 block">💊 Health Lodge eMAR</b>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Nurses log medications by meal time with timestamped records. No separate medical system and no second parent login. See <Link href="/camp-health-records-software" className="font-bold text-forest-800 underline">camp health records software</Link>.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
            <b className="font-display font-black text-lg text-stone-950 block">⚡ Gate Check-In</b>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              On opening day, gate staff search each camper by name, see their cabin and counselor, and mark them arrived.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border-2 border-stone-200 space-y-2">
            <b className="font-display font-black text-lg text-stone-950 block">🛒 Canteen POS & Bunk Notes</b>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Cashless canteen wallets, and bunk notes that staff enter and print in one click for mail call, in the same system as registration.
            </p>
          </div>
        </div>
      </section>

      {/* 5. MIGRATION */}
      <section className="bg-white rounded-3xl p-6 sm:p-12 border-2 border-stone-300 shadow-xl space-y-8">
        <div className="max-w-3xl space-y-2">
          <span className="eyebrow-pill bg-emerald-100 text-emerald-950 border border-emerald-300">
            SWITCHING
          </span>
          <h3 className="font-display font-black text-2xl sm:text-4xl text-stone-950">
            How to move your camp to CamperRoster
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Upload a spreadsheet export of your families and campers and map the columns yourself. No setup fee.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 1</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Export your roster</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Export families, campers, and contact details from your current system or spreadsheet as a CSV file.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 2</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Upload and map it</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Upload the file, match its columns to camper, guardian and health fields, and check the preview before importing. We can still help at no charge.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <span className="font-mono text-xs font-bold text-forest-800 bg-forest-100 px-2.5 py-1 rounded-full">STEP 3</span>
            <h4 className="font-display font-black text-base text-stone-950 pt-2">Open registration</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Share your registration link. Families register through your portal, and you pay only when campers register.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-4">
          <Link href="/start" className="btn-primary-agency text-xs sm:text-sm py-4 px-8">
            <Sparkles className="w-4 h-4" />
            <span>Launch Your Camp ($0 Setup)</span>
          </Link>
          <Link href="/campdoc-alternative" className="px-6 py-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm text-center">
            Also replacing CampDoc? →
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
          SOFTWARE SIZED TO YOUR CAMP
        </span>
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white">
          Launch your camp portal in 3 minutes.
        </h2>
        <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
          $0 setup, $0 per month off-season, and $4–$6 per registered camper. Check the math on the <Link href="/pricing" className="font-bold text-emerald-300 underline">pricing page</Link>.
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

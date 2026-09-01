import Link from "next/link";
import { Check } from "lucide-react";

export const metadata = {
  title: "CamperRoster Pricing — $0 Off-Season Retainers",
  description: "Transparent, seasonal camp registration software pricing with zero monthly fees when camp is closed.",
};

export default function PricingPage() {
  return (
    <main className="py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-800 font-mono text-xs font-bold uppercase tracking-wider">
            🏷️ Transparent Pricing
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-stone-900 tracking-tight">
            Pay when you register campers. <span className="text-forest-800">$0 during the winter.</span>
          </h1>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            No mandatory $300/mo off-season retainers. No annual minimum contracts. Just modern software that scales with your camp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="double-bezel p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="font-mono text-xs font-bold text-stone-500 uppercase">Starter Camp</span>
              <h3 className="font-display font-extrabold text-2xl text-stone-900">Up to 75 Campers</h3>
              <div className="text-3xl font-black font-display text-forest-900">$2.90 <span className="text-xs font-normal text-stone-500 font-body">/ registration</span></div>
              <p className="text-xs text-stone-600">Perfect for single-week church camps and scout troops.</p>
              <ul className="space-y-2 text-xs text-stone-700 pt-4 border-t border-stone-100">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 5-Step Camper Registration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Health History & Waivers</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> $0 Off-Season Monthly Fee</li>
              </ul>
            </div>
            <Link href="/register" className="w-full text-center py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs transition-colors">
              Get Started
            </Link>
          </div>

          <div className="double-bezel p-8 flex flex-col justify-between space-y-6 border-2 border-forest-800 shadow-xl relative bg-forest-50/20">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-forest-800 text-white font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
              Most Popular
            </div>
            <div className="space-y-4">
              <span className="font-mono text-xs font-bold text-forest-800 uppercase">Growth Camp</span>
              <h3 className="font-display font-extrabold text-2xl text-stone-900">75 to 500 Campers</h3>
              <div className="text-3xl font-black font-display text-forest-900">$3.90 <span className="text-xs font-normal text-stone-500 font-body">/ registration</span></div>
              <p className="text-xs text-stone-600">Full operations suite with KaiCalls Voice and Nurse eMAR.</p>
              <ul className="space-y-2 text-xs text-stone-700 pt-4 border-t border-stone-100">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Everything in Starter</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 24/7 KaiCalls Voice AI Receptionist</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Automated Volunteer Reference Calls</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Nurse Station eMAR & Cashless POS</li>
              </ul>
            </div>
            <Link href="/register" className="w-full text-center py-2.5 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-md transition-all">
              Start Free Trial →
            </Link>
          </div>

          <div className="double-bezel p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="font-mono text-xs font-bold text-stone-500 uppercase">Multi-Session</span>
              <h3 className="font-display font-extrabold text-2xl text-stone-900">500+ Campers</h3>
              <div className="text-3xl font-black font-display text-forest-900">Custom <span className="text-xs font-normal text-stone-500 font-body">volume discounts</span></div>
              <p className="text-xs text-stone-600">Multi-camp organizations and full summer season facilities.</p>
              <ul className="space-y-2 text-xs text-stone-700 pt-4 border-t border-stone-100">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Dedicated Account Manager</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Custom Voice AI Scripting</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Custom API & CRM Integrations</li>
              </ul>
            </div>
            <Link href="/volunteer" className="w-full text-center py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs transition-colors">
              Talk to Sales
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

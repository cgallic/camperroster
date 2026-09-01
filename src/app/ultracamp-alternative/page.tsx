import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";

export const metadata = {
  title: "UltraCamp Alternative — Modern Camp Registration (Zero Off-Season Retainers)",
  description: "Tired of UltraCamp's $275–$975/mo off-season fees? CamperRoster gives you 1-tap mobile registration, automated health forms, and KaiCalls voice answering.",
};

export default function UltraCampAlternativePage() {
  const comparison = [
    { feature: "Off-Season Monthly Retainer", ultracamp: "$275 to $975 / month (even in winter)", camperroster: "$0 / month (Pay only when open)" },
    { feature: "Mobile-First 5-Step Registration", ultracamp: "Desktop-first legacy multi-page forms", camperroster: "Responsive 5-step flow on any smartphone" },
    { feature: "Parent Form Auto-Save", ultracamp: "Session timeouts & lost keystrokes", camperroster: "Real-time auto-save + SMS Magic Links" },
    { feature: "Volunteer Reference Verification", ultracamp: "Manual emails & unending phone tag", camperroster: "Automated KaiCalls Voice Phone Checks" },
    { feature: "Medical Insurance Card Uploads", ultracamp: "Fails on 10MB phone camera uploads", camperroster: "In-Browser Compression (<500KB WebP)" },
    { feature: "Hidden Active Advantage Traps", ultracamp: "Third-party fee upsells", camperroster: "Zero buyer traps, 100% transparent" },
    { feature: "Nurse Station eMAR Dispenser", ultracamp: "Requires continuous WiFi connection", camperroster: "Offline-cached iPad / Tablet view" },
    { feature: "Setup & Onboarding Time", ultracamp: "2 to 4 weeks with account rep", camperroster: "Self-serve in under 15 minutes" },
  ];

  return (
    <main className="py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-800 font-mono text-xs font-bold uppercase tracking-wider">
            ⚡ UltraCamp Switcher Guide
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-stone-900 tracking-tight">
            Everything you love about camp management. <span className="text-forest-800">None of the off-season fees.</span>
          </h1>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            UltraCamp advertises plans at $275, $475, and $975 per month all year long. CamperRoster is built for small, church, and independent camps that refuse to pay software retainers while snow is on the ground.
          </p>
        </div>

        <div className="double-bezel overflow-hidden mb-12">
          <div className="p-6 bg-forest-900 text-white flex items-center justify-between">
            <h2 className="font-display font-extrabold text-xl">Head-to-Head Comparison</h2>
            <span className="font-mono text-xs text-forest-100 bg-white/10 px-3 py-1 rounded-full">Updated for 2027 Season</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 font-mono font-bold text-stone-700">
                  <th className="p-4 sm:p-5">Capability / Policy</th>
                  <th className="p-4 sm:p-5 text-stone-500">UltraCamp</th>
                  <th className="p-4 sm:p-5 text-forest-900 bg-forest-50/50">CamperRoster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {comparison.map((row, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
                    <td className="p-4 sm:p-5 font-bold text-stone-900">{row.feature}</td>
                    <td className="p-4 sm:p-5 text-stone-500">
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-alert-red shrink-0" />
                        <span>{row.ultracamp}</span>
                      </div>
                    </td>
                    <td className="p-4 sm:p-5 font-extrabold text-forest-950 bg-forest-50/30">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{row.camperroster}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-sun-50 border border-sun-100 rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <h3 className="font-display font-black text-2xl sm:text-3xl text-stone-900">
            Ready to ditch the off-season retainer?
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
            Import your camper records from UltraCamp in 1 click. Test CamperRoster free for your upcoming season.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow-md transition-all inline-flex items-center gap-2"
            >
              <span>Start Free Registration Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 font-bold text-xs py-3.5 px-6 rounded-xl transition-all"
            >
              View Transparent Pricing
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

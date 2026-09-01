import Link from "next/link";
import { Check, X, ArrowRight, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Camp Registration Software vs Google Forms (Why Spreadsheets Fail)",
  description: "Discover why small camps switch from Google Forms + Venmo to CamperRoster to prevent medical liability, missing insurance cards, and payment chaos.",
};

export default function VsGoogleFormsPage() {
  return (
    <main className="py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sun-50 border border-sun-100 text-sun-600 font-mono text-xs font-bold uppercase tracking-wider">
            📊 The Spreadsheet Upgrade
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-stone-900 tracking-tight">
            Why 50-camper programs outgrow <span className="text-sun-600">Google Forms</span> by week two.
          </h1>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            Google Forms is free for surveys. But for summer camp health records, severe allergy triage, 2-sided insurance uploads, and installment payments, it creates massive legal liability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-alert-red-bg border border-alert-red-border rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 font-display font-bold text-lg text-alert-red">
              <AlertTriangle className="w-5 h-5" />
              <span>The Google Forms + Venmo Trap</span>
            </div>
            <ul className="space-y-3 text-xs text-stone-700">
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-alert-red shrink-0 mt-0.5" />
                <span>Parents upload 15MB phone photos that immediately crash your Google Drive storage limits.</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-alert-red shrink-0 mt-0.5" />
                <span>Zero autosave — if a phone sleeps, all medical history for 3 siblings is lost.</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-alert-red shrink-0 mt-0.5" />
                <span>Manual Venmo reconciliation against rows in a spreadsheet with missing memos.</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-alert-red shrink-0 mt-0.5" />
                <span>Paper medical binders printed out that get rained on at the waterfront.</span>
              </li>
            </ul>
          </div>

          <div className="bg-forest-50 border border-forest-100 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 font-display font-bold text-lg text-forest-900">
              <Check className="w-5 h-5 text-emerald-600" />
              <span>The CamperRoster Solution</span>
            </div>
            <ul className="space-y-3 text-xs text-stone-700">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Client-side photo compression converts 10MB phone uploads to 400KB WebP instantly.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Continuous autosave with 1-tap SMS Magic Links to resume on any device.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Automatic Stripe deposits, automated receipts, and flexible 3-month installment plans.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Nurse Station eMAR on iPad with offline caching and 1-tap EpiPen triage.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/register"
            className="bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <span>Try the 5-Step Camper Flow</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

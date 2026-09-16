import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import CampSignupForm from "@/components/CampSignupForm";

export const metadata = {
  title: "Create Your Camp Portal",
  description:
    "Create a CamperRoster camp account. You get a director login and your own registration link — your camp's data is yours alone.",
};

/**
 * /start used to POST a camp row and tell the director a human would email them
 * later. It now runs the real provisioning path: the same form creates the auth
 * user, the camp, and the owning camp_members row, then signs the director in.
 * The form itself lives in CampSignupForm so /start and /signup cannot drift.
 */
export default function CampOnboardingPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 sm:py-16 space-y-8">
      <div className="text-center space-y-3">
        <span className="eyebrow-pill bg-forest-100 text-forest-900 border border-forest-200">
          <Sparkles className="w-3.5 h-3.5 text-sun-600" />
          <span>GET YOUR CAMP SET UP</span>
        </span>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-stone-900 tracking-tight">
          Create Your Camp Portal
        </h1>
        <p className="text-sm sm:text-base text-stone-600 font-medium max-w-md mx-auto">
          $0/month in the off-season. You get a director login and your own registration link — every
          camper, volunteer and health record you collect is scoped to your camp and nobody else&apos;s.
        </p>
      </div>

      {/* CampSignupForm reads ?next= via useSearchParams(), which needs a
          Suspense boundary or this route loses static rendering. */}
      <Suspense fallback={<div className="h-96 rounded-3xl bg-white border-2 border-stone-200 animate-pulse" />}>
        <CampSignupForm />
      </Suspense>
    </main>
  );
}

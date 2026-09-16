import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import CampSignupForm from "@/components/CampSignupForm";

export const metadata = {
  title: "Create a director account",
  description:
    "Create your CamperRoster director account and camp. One step: account, camp, and your own registration link.",
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10 sm:py-16 space-y-8">
      <div className="text-center space-y-3">
        <span className="eyebrow-pill bg-forest-100 text-forest-900 border border-forest-200">
          <ShieldCheck className="w-3.5 h-3.5 text-forest-800" />
          <span>DIRECTOR ACCOUNT</span>
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-stone-900 tracking-tight">
          Create your account and camp
        </h1>
        <p className="text-sm text-stone-600 font-medium max-w-md mx-auto">
          This creates three things at once: your login, your camp, and your ownership of it. If any
          one of them fails, none of them are created.
        </p>
      </div>

      {/* CampSignupForm reads ?next= via useSearchParams(), which needs a
          Suspense boundary or this route loses static rendering. */}
      <Suspense fallback={<div className="h-96 rounded-3xl bg-white border-2 border-stone-200 animate-pulse" />}>
        <CampSignupForm />
      </Suspense>

      <p className="text-center text-xs text-stone-500">
        Looking for the marketing walkthrough instead?{" "}
        <Link href="/start" className="font-bold text-forest-900 underline">
          /start
        </Link>{" "}
        uses this same form.
      </p>
    </main>
  );
}

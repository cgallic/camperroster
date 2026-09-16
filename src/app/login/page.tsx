import { Suspense } from "react";
import { Trees } from "lucide-react";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in",
  description: "Sign in to your CamperRoster camp dashboard.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-12 sm:py-20 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-forest-950 text-emerald-300 flex items-center justify-center mx-auto shadow-md">
          <Trees className="w-7 h-7" />
        </div>
        <h1 className="font-display font-black text-3xl text-stone-900 tracking-tight">
          Sign in to your camp
        </h1>
        <p className="text-sm text-stone-600 font-medium">
          Director, nurse and counselor screens are private to your camp.
        </p>
      </div>

      {/* useSearchParams() must sit inside a Suspense boundary or this page
          opts the whole route out of static rendering at build time. */}
      <Suspense fallback={<div className="h-64 rounded-3xl bg-white border-2 border-stone-200 animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

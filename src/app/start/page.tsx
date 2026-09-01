"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export default function CampOnboardingPage() {
  const [campName, setCampName] = useState("");
  const [directorEmail, setDirectorEmail] = useState("");
  const [campSlug, setCampSlug] = useState("");
  const [created, setCreated] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreated(true);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 sm:py-16 space-y-8">
      <div className="text-center space-y-3">
        <span className="eyebrow-pill bg-forest-100 text-forest-900 border border-forest-200">
          <Sparkles className="w-3.5 h-3.5 text-sun-600" />
          <span>LAUNCH YOUR CAMP IN 3 MINUTES</span>
        </span>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-stone-900 tracking-tight">
          Create Your Camp Portal
        </h1>
        <p className="text-sm sm:text-base text-stone-600 font-medium max-w-md mx-auto">
          $0/month in the off-season. Automated volunteer reference calling, 5-step parent registration, and health lodge eMAR.
        </p>
      </div>

      {created ? (
        <div className="bg-white rounded-3xl p-8 border-2 border-emerald-300 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-display font-black text-2xl text-stone-900">
            {campName || "Your Camp"} is Ready!
          </h2>
          <p className="text-sm text-stone-600">
            Your branded registration link is live at:
          </p>
          <div className="p-3 bg-stone-100 rounded-xl font-mono text-sm font-bold text-forest-900 border border-stone-200">
            https://camperroster.com/register?camp={campSlug || "mycamp"}
          </div>
          <div className="pt-4 flex justify-center gap-3">
            <Link href="/admin" className="btn-primary-agency text-xs py-3 px-6">
              Go to Director Hub
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-stone-200 shadow-xl space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-stone-800">Camp Organization Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Camp Evergreen, Pine Valley Camp..."
              value={campName}
              onChange={(e) => {
                setCampName(e.target.value);
                setCampSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
              }}
              className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-stone-800">Camp Director Email *</label>
            <input
              type="email"
              required
              placeholder="director@mycamp.org"
              value={directorEmail}
              onChange={(e) => setDirectorEmail(e.target.value)}
              className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-stone-800">Registration Subdomain Slug</label>
            <div className="flex items-center gap-2 p-3.5 rounded-xl border-2 border-stone-200 bg-stone-50 font-mono text-sm">
              <span className="text-stone-400">camperroster.com/</span>
              <b className="text-forest-900">{campSlug || "mycamp"}</b>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98"
          >
            <span>Launch Camp Portal ($0 Setup)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </main>
  );
}

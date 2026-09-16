"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import type { CampSignupPayload, CampSignupResponse } from "@/lib/formContracts";
import { normalizeSlug } from "@/lib/formContracts";

export default function CampOnboardingPage() {
  const [campName, setCampName] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [directorEmail, setDirectorEmail] = useState("");
  const [campSlug, setCampSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [savedSlug, setSavedSlug] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: CampSignupPayload = {
        campName,
        directorName,
        directorEmail,
        slug: normalizeSlug(campSlug || campName),
      };

      const res = await fetch("/api/camps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: CampSignupResponse = await res.json().catch(() => ({ success: false }));

      if (res.ok && data.success) {
        setSavedSlug(data.slug || payload.slug);
        setCreated(true);
      } else {
        setError(data.error || "We could not save your request. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Network error — your request was not saved. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
          $0/month in the off-season. Automated volunteer reference calling, 5-step parent registration, and health lodge eMAR.
        </p>
      </div>

      {created ? (
        <div className="bg-white rounded-3xl p-8 border-2 border-emerald-300 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-display font-black text-2xl text-stone-900">
            Request received for {campName || "your camp"}
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
            We have your details and reserved the link name below while we set you up. A member of the
            CamperRoster team will email <b>{directorEmail}</b> to finish configuring your camp — your
            portal is not live yet.
          </p>
          <div className="p-3 bg-stone-100 rounded-xl font-mono text-sm font-bold text-forest-900 border border-stone-200">
            reserved: {savedSlug}
          </div>
          <div className="pt-4 flex justify-center gap-3">
            <Link href="/" className="px-6 py-3 rounded-full bg-stone-100 text-stone-800 font-bold text-xs">
              Return Home
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
                if (!slugTouched) setCampSlug(normalizeSlug(e.target.value));
              }}
              className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-stone-800">Your Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dana Whitfield"
              value={directorName}
              onChange={(e) => setDirectorName(e.target.value)}
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
            <label className="text-xs sm:text-sm font-bold text-stone-800">Registration Link Name</label>
            <div className="flex items-center gap-1 p-1.5 pl-3.5 rounded-xl border-2 border-stone-200 bg-stone-50 font-mono text-sm">
              <span className="text-stone-400 shrink-0">camperroster.com/c/</span>
              <input
                type="text"
                value={campSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setCampSlug(normalizeSlug(e.target.value));
                }}
                placeholder="mycamp"
                className="flex-1 min-w-0 p-2 rounded-lg border border-stone-200 bg-white text-forest-900 font-bold focus:border-forest-800 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-stone-500">Lowercase letters, numbers and hyphens. We check availability when you submit.</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <b className="text-xs sm:text-sm font-black text-red-900 block">Request not saved</b>
                <span className="text-xs text-red-800 block">{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending your request...</span>
              </>
            ) : (
              <>
                <span>Request My Camp Portal ($0 Setup)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </main>
  );
}

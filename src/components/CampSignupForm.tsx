"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import type { CampSignupPayload, CampSignupResponse } from "@/lib/formContracts";
import { MIN_PASSWORD_LENGTH, normalizeSlug } from "@/lib/formContracts";

/**
 * The one camp-signup form. Rendered by both /start and /signup so there is a
 * single provisioning path (POST /api/camps) rather than two that drift.
 *
 * On success the director already has a session — the API route signs them in —
 * so this pushes straight to /admin, which is now behind middleware auth.
 */
/** Only same-origin, path-only redirects. Blocks //evil.com and https://evil.com. */
function safeNext(raw: string | null): string {
  if (!raw) return "/admin";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  return raw;
}

export default function CampSignupForm() {
  const router = useRouter();
  // A visitor sent here from a pricing button carries ?next=/billing?plan=pro.
  // Without this they would lose the plan they clicked.
  const next = safeNext(useSearchParams().get("next"));

  const [campName, setCampName] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [directorEmail, setDirectorEmail] = useState("");
  const [password, setPassword] = useState("");
  const [campSlug, setCampSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ slug: string; signedIn: boolean } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: CampSignupPayload = {
        campName,
        directorName,
        directorEmail,
        password,
        slug: normalizeSlug(campSlug || campName),
      };

      const res = await fetch("/api/camps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: CampSignupResponse = await res.json().catch(() => ({ success: false }));

      if (res.ok && data.success) {
        setCreated({ slug: data.slug || payload.slug, signedIn: Boolean(data.signedIn) });
        if (data.signedIn) {
          router.refresh();
          router.push(next);
        }
      } else {
        setError(data.error || "We could not create your camp. Nothing was saved. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Network error — nothing was created. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="bg-white rounded-3xl p-8 border-2 border-emerald-300 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="font-display font-black text-2xl text-stone-900">
          {campName || "Your camp"} is set up
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
          Your director account was created and you own this camp. Your registration link is below —
          families who open it register into <b>your</b> camp and nobody else&apos;s.
        </p>
        <div className="p-3 bg-stone-100 rounded-xl font-mono text-sm font-bold text-forest-900 border border-stone-200">
          camperroster.com/c/{created.slug}
        </div>
        <div className="pt-4 flex justify-center gap-3">
          {created.signedIn ? (
            <Link href={next} className="px-6 py-3 rounded-full bg-forest-900 text-white font-bold text-xs">
              Continue →
            </Link>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="px-6 py-3 rounded-full bg-forest-900 text-white font-bold text-xs"
            >
              Sign in →
            </Link>
          )}
          <Link href="/" className="px-6 py-3 rounded-full bg-stone-100 text-stone-800 font-bold text-xs">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleCreate} className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-stone-200 shadow-xl space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="campName" className="text-xs sm:text-sm font-bold text-stone-800">
          Camp Organization Name *
        </label>
        <input
          id="campName"
          name="campName"
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
        <label htmlFor="directorName" className="text-xs sm:text-sm font-bold text-stone-800">
          Your Name *
        </label>
        <input
          id="directorName"
          name="directorName"
          type="text"
          required
          placeholder="e.g. Dana Whitfield"
          value={directorName}
          onChange={(e) => setDirectorName(e.target.value)}
          className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="directorEmail" className="text-xs sm:text-sm font-bold text-stone-800">
          Camp Director Email *
        </label>
        <input
          id="directorEmail"
          name="directorEmail"
          type="email"
          required
          autoComplete="email"
          placeholder="director@mycamp.org"
          value={directorEmail}
          onChange={(e) => setDirectorEmail(e.target.value)}
          className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
        />
        <p className="text-[11px] text-stone-500">This is the email you will sign in with.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs sm:text-sm font-bold text-stone-800">
          Choose a Password *
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3.5 rounded-xl border-2 border-stone-200 text-stone-900 text-base focus:border-forest-800 focus:outline-none"
        />
        <p className="text-[11px] text-stone-500">
          Your dashboard holds campers&apos; medical records. Use a password you do not use anywhere else.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="campSlug" className="text-xs sm:text-sm font-bold text-stone-800">
          Registration Link Name
        </label>
        <div className="flex items-center gap-1 p-1.5 pl-3.5 rounded-xl border-2 border-stone-200 bg-stone-50 font-mono text-sm">
          <span className="text-stone-400 shrink-0">camperroster.com/c/</span>
          <input
            id="campSlug"
            name="campSlug"
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
        <p className="text-[11px] text-stone-500">
          Lowercase letters, numbers and hyphens. We check availability when you submit.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <b className="text-xs sm:text-sm font-black text-red-900 block">Camp not created</b>
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
            <span>Creating your camp...</span>
          </>
        ) : (
          <>
            <span>Create My Camp ($0 Setup)</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-stone-500">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-forest-900 underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

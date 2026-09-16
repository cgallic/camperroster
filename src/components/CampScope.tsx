"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { normalizeSlug } from "@/lib/formContracts";

/**
 * Which camp is this public form submitting to?
 *
 * /register and /volunteer used to write into a hardcoded tenant
 * (organization_id = '11111111-…'), so the question never came up. Now the camp
 * comes from ?camp=<slug> — the parameter /c/<slug> already puts on its links —
 * and a form with no resolvable camp refuses to submit rather than filing a
 * child's medical record under whichever camp happens to be first in the table.
 *
 * Uses useSearchParams(), so every caller must render it inside <Suspense>.
 */

export type CampScope =
  | { status: "missing" }
  | { status: "loading"; slug: string }
  | { status: "found"; slug: string; name: string }
  | { status: "not_found"; slug: string }
  | { status: "setup_incomplete"; slug: string }
  | { status: "error"; slug: string; message: string };

export function useCampScope(): CampScope {
  const searchParams = useSearchParams();
  const slug = normalizeSlug(searchParams.get("camp") ?? "");
  const [scope, setScope] = useState<CampScope>(slug ? { status: "loading", slug } : { status: "missing" });

  useEffect(() => {
    if (!slug) {
      setScope({ status: "missing" });
      return;
    }

    let cancelled = false;
    setScope({ status: "loading", slug });

    (async () => {
      try {
        const res = await fetch(`/api/camps?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({ success: false }));
        if (cancelled) return;

        if (res.status === 503) {
          setScope({ status: "setup_incomplete", slug });
        } else if (res.status === 404) {
          setScope({ status: "not_found", slug });
        } else if (res.ok && data.success && data.camp?.name) {
          setScope({ status: "found", slug: data.camp.slug || slug, name: data.camp.name });
        } else {
          setScope({ status: "error", slug, message: data.error || "Camp lookup failed." });
        }
      } catch (err: any) {
        if (!cancelled) setScope({ status: "error", slug, message: err?.message || "Network error." });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return scope;
}

/**
 * Shown instead of the form whenever the camp cannot be resolved. Every branch
 * says plainly that nothing will be saved, and offers the one thing that fixes
 * it: the camp's own link.
 */
export function CampScopeBlocker({
  scope,
  what,
}: {
  scope: CampScope;
  what: "registration" | "volunteer application";
}) {
  const router = useRouter();
  const [typed, setTyped] = useState("");

  if (scope.status === "loading") {
    return (
      <div className="max-w-xl mx-auto py-16 flex items-center justify-center gap-3 text-stone-500 text-sm font-bold">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Finding that camp…</span>
      </div>
    );
  }

  const heading =
    scope.status === "missing"
      ? `Which camp is this ${what} for?`
      : scope.status === "not_found"
        ? `No camp at "${scope.slug}"`
        : scope.status === "setup_incomplete"
          ? "This deployment is not set up yet"
          : "Could not look up that camp";

  const body =
    scope.status === "missing"
      ? `This page was opened without a camp link, so there is nothing to attach your ${what} to. Open your camp's own link — camperroster.com/c/your-camp — or type its link name below.`
      : scope.status === "not_found"
        ? `No camp is registered at camperroster.com/c/${scope.slug}. Check the link your camp gave you. Nothing has been saved.`
        : scope.status === "setup_incomplete"
          ? "The database behind this site has not been migrated yet, so camps cannot be looked up. Nothing has been saved. Please tell the camp office."
          : `${(scope as { message: string }).message} Nothing has been saved.`;

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const s = normalizeSlug(typed);
    if (s) router.push(`?camp=${encodeURIComponent(s)}`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-20">
      <div className="bg-white rounded-3xl p-8 border-2 border-amber-300 shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="font-display font-black text-2xl text-stone-900">{heading}</h1>
        <p className="text-sm text-stone-600 leading-relaxed">{body}</p>

        {(scope.status === "missing" || scope.status === "not_found") && (
          <form onSubmit={go} className="space-y-2 pt-2">
            <label htmlFor="campLink" className="text-xs font-bold text-stone-800 block">
              Camp link name
            </label>
            <div className="flex items-center gap-1 p-1.5 pl-3.5 rounded-xl border-2 border-stone-200 bg-stone-50 font-mono text-sm">
              <span className="text-stone-400 shrink-0">camperroster.com/c/</span>
              <input
                id="campLink"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="your-camp"
                className="flex-1 min-w-0 p-2 rounded-lg border border-stone-200 bg-white text-forest-900 font-bold focus:border-forest-800 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-2">
          <Link href="/" className="text-xs font-bold text-stone-500 underline">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

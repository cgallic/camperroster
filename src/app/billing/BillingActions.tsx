"use client";

import { useState } from "react";
import { ArrowRight, ExternalLink, Loader2 } from "lucide-react";

type Plan = "starter" | "pro";

interface Props {
  /** Plans whose Stripe Price id is configured on the server. */
  availablePlans: Plan[];
  /** True when the camp already has a Stripe customer to manage. */
  hasBillingAccount: boolean;
  /** Plan to pre-highlight, e.g. arriving from /pricing?plan=pro. */
  suggestedPlan?: Plan | null;
}

const PLAN_COPY: Record<Plan, { label: string; price: string }> = {
  starter: { label: "Starter", price: "$4.00 / registered camper" },
  pro: { label: "Pro", price: "$6.00 / registered camper" },
};

/**
 * The only two money buttons in the app.
 *
 * Neither one changes any local state that implies payment. They ask the
 * server for a URL and navigate to it; Stripe owns everything after that, and
 * the camp is not marked paid until the webhook says so.
 */
export default function BillingActions({ availablePlans, hasBillingAccount, suggestedPlan }: Props) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: Plan) {
    setError(null);
    setPending(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(`/billing?plan=${plan}`)}`;
        return;
      }
      if (!res.ok || !data?.checkout_url) {
        setError(data?.message || data?.error || "Could not start checkout. No charge was attempted.");
        setPending(null);
        return;
      }
      // Hand off to Stripe. Nothing here records a payment.
      window.location.href = data.checkout_url as string;
    } catch {
      setError("Could not reach the server. No charge was attempted.");
      setPending(null);
    }
  }

  async function openPortal() {
    setError(null);
    setPending("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        window.location.href = "/login?next=%2Fbilling";
        return;
      }
      if (!res.ok || !data?.portal_url) {
        setError(data?.message || data?.error || "Could not open the billing portal.");
        setPending(null);
        return;
      }
      window.location.href = data.portal_url as string;
    } catch {
      setError("Could not reach the server.");
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      {hasBillingAccount && (
        <button
          type="button"
          onClick={openPortal}
          disabled={pending !== null}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-950 disabled:opacity-60 text-white font-extrabold text-sm"
        >
          {pending === "portal" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          <span>Manage billing in Stripe</span>
        </button>
      )}

      {availablePlans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availablePlans.map((plan) => {
            const isSuggested = suggestedPlan === plan;
            return (
              <button
                key={plan}
                type="button"
                onClick={() => startCheckout(plan)}
                disabled={pending !== null}
                className={`flex items-center justify-between gap-2 px-5 py-4 rounded-xl border-2 font-extrabold text-sm text-left transition-colors disabled:opacity-60 ${
                  isSuggested
                    ? "border-emerald-500 bg-emerald-50 text-stone-950"
                    : "border-stone-200 bg-white text-stone-900 hover:border-stone-400"
                }`}
              >
                <span className="space-y-0.5">
                  <span className="block">
                    {hasBillingAccount ? `Switch to ${PLAN_COPY[plan].label}` : `Start ${PLAN_COPY[plan].label}`}
                  </span>
                  <span className="block text-xs font-bold text-stone-500">{PLAN_COPY[plan].price}</span>
                </span>
                {pending === plan ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <ArrowRight className="w-4 h-4 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}
    </div>
  );
}

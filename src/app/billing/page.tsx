import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentCamp, isSetupIncompleteError } from "@/lib/auth";
import { BILLING_PLANS, planIsConfigured, stripeIsConfigured, type BillingPlan } from "@/lib/stripe";
import {
  countRegisteredCampers,
  getCampStripeCustomerId,
  getCampSubscription,
  isBillingSetupIncomplete,
  subscriptionIsPaid,
  type CampSubscriptionRow,
} from "@/app/api/billing/data";
import BillingActions from "./BillingActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Billing — CamperRoster",
  description: "Your CamperRoster plan, registered-camper count, and next renewal.",
  robots: { index: false, follow: false },
};

/** Stripe status -> what a camp director should actually read. */
const STATUS_COPY: Record<string, { label: string; tone: "good" | "warn" | "bad" }> = {
  active: { label: "Active", tone: "good" },
  trialing: { label: "Trialing", tone: "good" },
  past_due: { label: "Past due — payment failed", tone: "warn" },
  unpaid: { label: "Unpaid — subscription suspended", tone: "bad" },
  incomplete: { label: "Incomplete — first payment not finished", tone: "warn" },
  incomplete_expired: { label: "Expired before first payment", tone: "bad" },
  canceled: { label: "Canceled", tone: "bad" },
  paused: { label: "Paused", tone: "warn" },
};

function statusCopy(status: string) {
  return STATUS_COPY[status] ?? { label: status, tone: "warn" as const };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function Notice({ tone, children }: { tone: "info" | "warn" | "good"; children: React.ReactNode }) {
  const styles =
    tone === "good"
      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
      : tone === "warn"
        ? "bg-amber-50 border-amber-300 text-amber-950"
        : "bg-stone-100 border-stone-300 text-stone-800";
  return (
    <div className={`rounded-2xl border-2 px-5 py-4 text-sm font-bold ${styles}`}>{children}</div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-500 block">
        {label}
      </span>
      <b className="font-display font-black text-2xl text-stone-950 block">{value}</b>
      {sub && <span className="text-xs font-medium text-stone-500 block">{sub}</span>}
    </div>
  );
}

/**
 * /billing — the camp director's view of what they are paying.
 *
 * Everything on this page is read back from the database, which in turn is
 * written only by the signature-verified Stripe webhook. The page never infers
 * "paid" from a redirect query string: landing here with ?checkout=complete
 * says the director finished Stripe's form, not that the subscription exists
 * yet, and the copy below says exactly that.
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const checkoutState = typeof params.checkout === "string" ? params.checkout : null;
  const requestedPlanRaw = typeof params.plan === "string" ? params.plan : null;
  const suggestedPlan: BillingPlan | null =
    requestedPlanRaw === "starter" || requestedPlanRaw === "pro" ? requestedPlanRaw : null;

  // ---- Who is this -----------------------------------------------------------
  let camp: Awaited<ReturnType<typeof getCurrentCamp>>;
  try {
    camp = await getCurrentCamp();
  } catch (err) {
    if (isSetupIncompleteError(err)) {
      return (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-6">
          <h1 className="font-display font-black text-3xl text-stone-950">Billing</h1>
          <Notice tone="warn">
            Database setup is incomplete — the tenancy migration has not been applied to this
            environment yet. Billing cannot be shown until it is.
          </Notice>
        </main>
      );
    }
    throw err;
  }

  if (!camp) redirect("/login?next=%2Fbilling");

  // ---- What does Stripe know -------------------------------------------------
  const configured = stripeIsConfigured();
  const availablePlans = (Object.keys(BILLING_PLANS) as BillingPlan[]).filter(
    (plan) => configured && planIsConfigured(plan)
  );

  let subscription: CampSubscriptionRow | null = null;
  let camperCount: number | null = null;
  let customerId: string | null = null;
  let setupIncomplete = false;

  try {
    [subscription, camperCount, customerId] = await Promise.all([
      getCampSubscription(camp.campId),
      countRegisteredCampers(camp.campId),
      getCampStripeCustomerId(camp.campId),
    ]);
  } catch (err) {
    if (isBillingSetupIncomplete(err)) {
      setupIncomplete = true;
    } else {
      throw err;
    }
  }

  const paid = subscriptionIsPaid(subscription);
  const planSpec = subscription?.plan === "starter" || subscription?.plan === "pro"
    ? BILLING_PLANS[subscription.plan]
    : null;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      <header className="space-y-2">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-stone-500">
          {camp.campName}
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-stone-950">Billing</h1>
        <p className="text-sm text-stone-600 font-medium">
          You are billed per registered camper, with nothing charged in the off-season.
        </p>
      </header>

      {checkoutState === "complete" && (
        <Notice tone="good">
          Stripe has your payment details. Your subscription becomes active here as soon as Stripe
          confirms it — that confirmation arrives by webhook, usually within seconds. If the status
          below has not changed in a few minutes, contact support rather than paying again.
        </Notice>
      )}
      {checkoutState === "cancelled" && (
        <Notice tone="info">Checkout was cancelled. Nothing was charged.</Notice>
      )}

      {setupIncomplete && (
        <Notice tone="warn">
          The billing migration (<code>supabase/migrations/0002_billing.sql</code>) has not been
          applied to this environment, so subscription state cannot be read.
        </Notice>
      )}

      {!configured && (
        <Notice tone="warn">
          Payments are not configured on this deployment. <code>STRIPE_SECRET_KEY</code> and the
          plan price ids are unset, so no subscription can be started here yet. Nothing is being
          charged, and nothing on this page is a placeholder for a real payment.
        </Notice>
      )}

      {configured && availablePlans.length === 0 && (
        <Notice tone="warn">
          Stripe is connected, but no plan price ids are configured
          (<code>STRIPE_PRICE_STARTER</code> / <code>STRIPE_PRICE_PRO</code>), so checkout is
          unavailable.
        </Notice>
      )}

      {/* ---- Current state ---- */}
      <section className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 space-y-8 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-500 block">
              Current plan
            </span>
            <b className="font-display font-black text-2xl text-stone-950 block">
              {planSpec ? planSpec.label : subscription ? "Unrecognised plan" : "No plan yet"}
            </b>
            {planSpec && (
              <span className="text-xs font-bold text-stone-500 block">
                ${planSpec.unitPriceUsd.toFixed(2)} per registered camper
              </span>
            )}
          </div>

          {subscription && (
            <span
              className={`shrink-0 text-xs font-black px-3 py-1.5 rounded-full border ${
                statusCopy(subscription.status).tone === "good"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : statusCopy(subscription.status).tone === "warn"
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : "bg-rose-50 border-rose-300 text-rose-900"
              }`}
            >
              {statusCopy(subscription.status).label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <Stat
            label="Registered campers"
            value={camperCount === null ? "—" : String(camperCount)}
            sub="submitted or confirmed"
          />
          <Stat
            label="Billed quantity"
            value={subscription?.quantity != null ? String(subscription.quantity) : "—"}
            sub="as Stripe has it"
          />
          <Stat
            label={subscription?.cancel_at_period_end ? "Access ends" : "Next renewal"}
            value={formatDate(subscription?.current_period_end ?? null)}
          />
          <Stat label="Off-season" value="$0" sub="no camper, no charge" />
        </div>

        {subscription?.cancel_at_period_end && (
          <Notice tone="warn">
            This subscription is set to cancel at the end of the current period. You keep access
            until {formatDate(subscription.current_period_end)}.
          </Notice>
        )}

        {!paid && !subscription && configured && (
          <p className="text-sm text-stone-600 font-medium">
            This camp has no subscription yet. Nothing has been charged.
          </p>
        )}
      </section>

      {/* ---- Actions ---- */}
      {configured && (
        <section className="space-y-4">
          <h2 className="font-display font-black text-xl text-stone-950">
            {customerId ? "Manage your subscription" : "Start a subscription"}
          </h2>
          <BillingActions
            availablePlans={availablePlans}
            hasBillingAccount={Boolean(customerId)}
            suggestedPlan={suggestedPlan}
          />
          <p className="text-xs text-stone-500 font-medium">
            Card details, invoices, and cancellation are handled by Stripe. CamperRoster never sees
            or stores a card number.
          </p>
        </section>
      )}

      <p className="text-xs text-stone-500 font-medium">
        Running 1,500+ campers or several camps?{" "}
        <Link href="/pricing" className="underline font-bold">
          Network pricing
        </Link>{" "}
        is quoted by volume — contact sales rather than checking out here.
      </p>
    </main>
  );
}

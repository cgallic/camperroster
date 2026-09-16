import Stripe from "stripe";

/**
 * Stripe wiring for CamperRoster.
 *
 * The camp — not the parent — is the paying customer. Published pricing is
 * per-unit recurring, where the unit is a registered camper:
 *   Starter  $4.00 / registered camper
 *   Pro      $6.00 / registered camper
 * Both bill $0 in the off-season because quantity goes to its floor when no
 * campers are registered.
 *
 * Nothing in this file has a hardcoded key or a fallback key. If the
 * environment is not configured, every accessor throws StripeNotConfiguredError
 * and the caller answers 503. A missing key must never degrade into a
 * fabricated session, customer, or paid state.
 */

/**
 * Pinned Stripe API version.
 *
 * This is the version the installed stripe-node (v22.x) is typed against —
 * `LatestApiVersion` in node_modules/stripe/esm/apiVersion.d.ts. Pinning it
 * means a Stripe-side default bump cannot silently change response shapes
 * under us. Two shapes this version in particular implies, both relied on in
 * the webhook handler:
 *   - Subscription has NO top-level `current_period_end`; the period lives on
 *     each subscription item (`subscription.items.data[].current_period_end`).
 *   - Invoice has NO top-level `subscription`; it lives at
 *     `invoice.parent.subscription_details.subscription`.
 */
export const STRIPE_API_VERSION = "2026-08-26.dahlia" as const;

/** Thrown whenever a required Stripe env var is missing or blank. */
export class StripeNotConfiguredError extends Error {
  readonly code = "stripe_not_configured";
  /** The env var that is missing, e.g. "STRIPE_SECRET_KEY". */
  readonly missingEnvVar: string;

  constructor(missingEnvVar: string) {
    super(
      `Stripe is not configured: ${missingEnvVar} is unset. ` +
        `Set it in the environment before payments can be taken.`
    );
    this.name = "StripeNotConfiguredError";
    this.missingEnvVar = missingEnvVar;
  }
}

export function isStripeNotConfiguredError(err: unknown): err is StripeNotConfiguredError {
  return err instanceof StripeNotConfiguredError;
}

/** Read an env var, treating "" and whitespace as unset. */
function requireEnv(name: string): string {
  const raw = process.env[name];
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) throw new StripeNotConfiguredError(name);
  return value;
}

function hasEnv(name: string): boolean {
  const raw = process.env[name];
  return typeof raw === "string" && raw.trim().length > 0;
}

let cachedClient: Stripe | null = null;
let cachedForKey: string | null = null;

/**
 * Lazily construct the Stripe client.
 *
 * Constructed on first use, not at module load, so importing this file in a
 * route that never reaches Stripe cannot crash a build or a cold start. Never
 * constructs with an empty key — an empty-key client produces confusing 401s
 * from Stripe instead of an honest "not configured" answer here.
 */
export function getStripe(): Stripe {
  const secretKey = requireEnv("STRIPE_SECRET_KEY");
  if (cachedClient && cachedForKey === secretKey) return cachedClient;

  cachedClient = new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    appInfo: { name: "CamperRoster", url: "https://camperroster.com" },
  });
  cachedForKey = secretKey;
  return cachedClient;
}

/** True when a secret key is present. Does not validate it against Stripe. */
export function stripeIsConfigured(): boolean {
  return hasEnv("STRIPE_SECRET_KEY");
}

/** The signing secret for POST /api/stripe/webhook. */
export function getWebhookSecret(): string {
  return requireEnv("STRIPE_WEBHOOK_SECRET");
}

// ---- Plans ------------------------------------------------------------------

export type BillingPlan = "starter" | "pro";

export interface BillingPlanSpec {
  /** Machine value stored in camp_subscriptions.plan. */
  plan: BillingPlan;
  /** Label as printed on /pricing. */
  label: string;
  /** Dollars per registered camper, per the published price on /pricing. */
  unitPriceUsd: number;
  /** Env var holding the Stripe Price id for this plan. */
  priceEnvVar: "STRIPE_PRICE_STARTER" | "STRIPE_PRICE_PRO";
}

/**
 * The two self-serve plans. "Network" is deliberately absent: it is custom
 * volume pricing and stays a sales conversation, not a checkout button.
 *
 * unitPriceUsd is documentation of the published price. The amount actually
 * charged is whatever the Stripe Price object says — these numbers are not
 * sent to Stripe and cannot override it.
 */
export const BILLING_PLANS: Record<BillingPlan, BillingPlanSpec> = {
  starter: {
    plan: "starter",
    label: "Starter",
    unitPriceUsd: 4,
    priceEnvVar: "STRIPE_PRICE_STARTER",
  },
  pro: {
    plan: "pro",
    label: "Pro",
    unitPriceUsd: 6,
    priceEnvVar: "STRIPE_PRICE_PRO",
  },
};

export function isBillingPlan(value: unknown): value is BillingPlan {
  return value === "starter" || value === "pro";
}

/** Resolve the Stripe Price id for a plan. Throws when the env var is unset. */
export function getPriceId(plan: BillingPlan): string {
  return requireEnv(BILLING_PLANS[plan].priceEnvVar);
}

/** True when this plan's price id is configured. */
export function planIsConfigured(plan: BillingPlan): boolean {
  return hasEnv(BILLING_PLANS[plan].priceEnvVar);
}

/** Map a Stripe Price id back to a plan, for webhook payloads. */
export function planForPriceId(priceId: string | null | undefined): BillingPlan | null {
  if (!priceId) return null;
  for (const spec of Object.values(BILLING_PLANS)) {
    const configured = process.env[spec.priceEnvVar];
    if (typeof configured === "string" && configured.trim() === priceId) return spec.plan;
  }
  return null;
}

// ---- Site URL ---------------------------------------------------------------

/**
 * Absolute site origin, used to build Checkout success/cancel URLs and the
 * Billing Portal return URL. No localhost fallback: a wrong origin here sends
 * a paying director to a dead page after they pay.
 */
export function getSiteUrl(): string {
  return requireEnv("NEXT_PUBLIC_SITE_URL").replace(/\/+$/, "");
}

import Stripe from "stripe";

/**
 * One lazily-built Stripe client. Built on first use rather than at module load
 * so that importing anything in this tree does not blow up a build or a test
 * run on a machine that has no keys.
 */
let client: Stripe | null = null;

export function stripeClient(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured on this environment");
  client = new Stripe(key);
  return client;
}

export function webhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Stripe webhook verification is not configured on this environment");
  return secret;
}

/** Where Stripe sends the family back to. */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}

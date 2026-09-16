import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  getStripe,
  getBillingWebhookSecret,
  isStripeNotConfiguredError,
  planForPriceId,
  type BillingPlan,
} from "@/lib/stripe";
import {
  claimStripeEvent,
  findCampIdByStripeCustomerId,
  isBillingSetupIncomplete,
  releaseStripeEvent,
  setCampStripeCustomerId,
  upsertCampSubscription,
} from "@/app/api/billing/data";

// Must run on the Node runtime: signature verification needs the raw body and
// the stripe-node crypto provider.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/webhook — the ONLY thing in this codebase that may mark a
 * camp as paid.
 *
 * Not to be confused with /api/stripe/webhook, which settles FAMILY tuition.
 * Both endpoints are registered on the same Stripe account and both receive
 * every event, so each claims event ids in stripe_events under its own handler
 * and ignores sessions that are not its mode.
 *
 * Three properties this handler must have, in order:
 *
 *  1. VERIFIED. The signature is checked against STRIPE_BILLING_WEBHOOK_SECRET
 *     (this endpoint's own secret, not the tuition endpoint's) using
 *     the RAW request body. In the App Router that means `await req.text()` —
 *     `req.json()` re-serialises and the computed signature will not match.
 *     Anything that fails verification is rejected with 400 and writes nothing.
 *
 *  2. IDEMPOTENT. Stripe retries, and can deliver the same event twice
 *     concurrently. Each event id is claimed in stripe_events before the
 *     handler runs; a replay finds the row and no-ops. If the handler then
 *     fails, the claim is released so Stripe's retry is not swallowed.
 *
 *  3. FAST. Work is a handful of Stripe reads plus one upsert, then 200.
 *
 * Contrast with src/app/api/kaicalls/webhook/route.ts, which is unauthenticated
 * and lets any caller flip safety_approved on a volunteer reference. That is a
 * live vulnerability and it is NOT the pattern used here.
 */

/** Events we act on. Everything else is acknowledged and ignored. */
const HANDLED_EVENTS = new Set<Stripe.Event["type"]>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function isoFromUnix(seconds: number | null | undefined): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}

/**
 * Resolve which camp a subscription belongs to.
 *
 * metadata.camp_id is stamped by the checkout route via subscription_data, so
 * it is present on every subscription this app creates. The customer lookup is
 * the fallback for a subscription created by hand in the Stripe dashboard.
 */
async function resolveCampId(subscription: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = subscription.metadata?.camp_id;
  if (typeof fromMetadata === "string" && fromMetadata.trim()) return fromMetadata.trim();

  const customerId = idOf(subscription.customer);
  if (!customerId) return null;
  return findCampIdByStripeCustomerId(customerId);
}

/** Write a subscription's current state to camp_subscriptions. */
async function syncSubscription(subscription: Stripe.Subscription): Promise<"synced" | "no_camp"> {
  const campId = await resolveCampId(subscription);
  if (!campId) {
    // Not ours, or the customer was never linked. Acknowledge, do not guess:
    // writing a row against the wrong camp would mark the wrong camp paid.
    console.warn("[stripe] subscription with no resolvable camp", subscription.id);
    return "no_camp";
  }

  // In the pinned API version the billing period lives on the subscription
  // ITEM, not on the subscription. Per-camper pricing means exactly one item.
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.id ?? null;
  const metadataPlan = subscription.metadata?.plan;
  const plan: BillingPlan | null =
    metadataPlan === "starter" || metadataPlan === "pro" ? metadataPlan : planForPriceId(priceId);

  const customerId = idOf(subscription.customer);

  await upsertCampSubscription({
    campId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    stripePriceId: priceId,
    plan,
    status: subscription.status,
    quantity: item?.quantity ?? null,
    currentPeriodEnd: isoFromUnix(item?.current_period_end),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });

  return "synced";
}

async function handleEvent(stripe: Stripe, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription") return;

      const campId =
        (typeof session.metadata?.camp_id === "string" && session.metadata.camp_id) ||
        session.client_reference_id ||
        null;
      const customerId = idOf(session.customer);

      // Link the customer to the camp now, so later customer.subscription.*
      // events can be resolved even if metadata is ever missing.
      if (campId && customerId) {
        await setCampStripeCustomerId(campId, customerId);
      }

      const subscriptionId = idOf(session.subscription);
      if (!subscriptionId) return;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(subscription);
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // The deleted event already carries status "canceled"; syncing it is
      // what removes the camp's paid state.
      await syncSubscription(event.data.object);
      return;
    }

    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      // In the pinned API version an invoice points at its subscription
      // through parent.subscription_details, not a top-level field.
      const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
      if (!subscriptionId) return;

      // Re-read rather than inferring: the subscription object is the source of
      // truth for status (active / past_due / unpaid) after a payment result.
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(subscription);
      return;
    }

    default:
      return;
  }
}

export async function POST(req: Request) {
  // 1. Raw body FIRST. Never req.json() here — verification would always fail.
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let stripe: Stripe;
  let webhookSecret: string;
  try {
    stripe = getStripe();
    webhookSecret = getBillingWebhookSecret();
  } catch (err) {
    if (isStripeNotConfiguredError(err)) {
      // Cannot verify, so cannot trust. Never process an unverified payload.
      return NextResponse.json(
        { error: "stripe_not_configured", message: `${err.missingEnvVar} is unset.` },
        { status: 503 }
      );
    }
    throw err;
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    console.error("[stripe] webhook signature verification failed:", message);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // 2. Claim the event id. A replay returns 200 without touching anything.
  let claimed: boolean;
  try {
    claimed = await claimStripeEvent(event.id, event.type);
  } catch (err) {
    if (isBillingSetupIncomplete(err)) {
      // The migration is not applied. 503 makes Stripe retry after deploy
      // instead of marking the event delivered and dropping it.
      return NextResponse.json({ error: "setup_incomplete" }, { status: 503 });
    }
    throw err;
  }

  if (!claimed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, handled: false });
  }

  // 3. Process. On failure, release the claim and 500 so Stripe retries.
  try {
    await handleEvent(stripe, event);
  } catch (err) {
    await releaseStripeEvent(event.id);
    const message = err instanceof Error ? err.message : "handler failed";
    console.error("[stripe] webhook handler failed", event.type, event.id, message);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true, handled: true });
}

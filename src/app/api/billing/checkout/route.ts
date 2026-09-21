import { NextResponse } from "next/server";

import { getCurrentCamp, getCurrentUser, isSetupIncompleteError } from "@/lib/auth";
import {
  BILLING_PLANS,
  getPriceId,
  getSiteUrl,
  getStripe,
  isBillingPlan,
  isStripeNotConfiguredError,
} from "@/lib/stripe";
import {
  countRegisteredCampers,
  getCampDirectorEmail,
  getCampStripeCustomerId,
  isBillingSetupIncomplete,
  setCampStripeCustomerId,
} from "@/app/api/billing/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/checkout
 *
 * Starts a real Stripe Checkout Session in subscription mode for the signed-in
 * director's camp. The published price is per registered camper, so the
 * subscription is a per-unit recurring price with quantity = the camp's
 * current registered-camper count.
 *
 * Two rules this route exists to enforce:
 *
 *  1. The camp is resolved from the server session via getCurrentCamp(). The
 *     request body is NEVER trusted for a camp_id. If it were, anyone could
 *     post another camp's id and start a subscription billed to that camp.
 *
 *  2. When Stripe is not configured, this returns 503 and stops. It does not
 *     fabricate a session id, a checkout url, or a "paid" state. The only
 *     thing that may ever mark a camp as paid is the signature-verified
 *     webhook at /api/stripe/webhook.
 *
 * Request body: { "plan": "starter" | "pro" }
 * Response:     { success: true, checkout_url, session_id }
 */
export async function POST(req: Request) {
  // ---- 1. Who is asking ----------------------------------------------------
  let camp: Awaited<ReturnType<typeof getCurrentCamp>>;
  try {
    camp = await getCurrentCamp();
  } catch (err) {
    if (isSetupIncompleteError(err)) {
      return NextResponse.json(
        { success: false, error: "setup_incomplete", message: "Database setup is incomplete." },
        { status: 503 }
      );
    }
    throw err;
  }

  if (!camp) {
    return NextResponse.json(
      { success: false, error: "not_authenticated", message: "Sign in as a camp director to start a subscription." },
      { status: 401 }
    );
  }
  if (camp.role !== "director") {
    return NextResponse.json(
      { success: false, error: "forbidden", message: "Only a camp director can change the camp subscription." },
      { status: 403 }
    );
  }

  // ---- 2. What are they buying --------------------------------------------
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const requestedPlan = (body as { plan?: unknown } | null)?.plan;
  if (!isBillingPlan(requestedPlan)) {
    return NextResponse.json(
      { success: false, error: 'plan must be "starter" or "pro". Network pricing is a sales conversation, not a checkout.' },
      { status: 400 }
    );
  }
  const plan = requestedPlan;

  // ---- 3. Is Stripe actually configured -----------------------------------
  let stripe: ReturnType<typeof getStripe>;
  let priceId: string;
  let siteUrl: string;
  try {
    stripe = getStripe();
    priceId = getPriceId(plan);
    siteUrl = getSiteUrl();
  } catch (err) {
    if (isStripeNotConfiguredError(err)) {
      return NextResponse.json(
        {
          success: false,
          error: "stripe_not_configured",
          message: `Payments are not configured yet (${err.missingEnvVar} is unset). No charge was attempted.`,
        },
        { status: 503 }
      );
    }
    throw err;
  }

  try {
    // ---- 4. Quantity = registered campers ---------------------------------
    const quantity = await countRegisteredCampers(camp.campId);

    // ---- 5. Reuse or create the Stripe Customer ---------------------------
    let customerId = await getCampStripeCustomerId(camp.campId);

    if (customerId) {
      // A customer saved earlier can have been deleted in the Stripe dashboard.
      // Retrieving it is cheaper than a failed Checkout and lets us recover.
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if (existing.deleted) customerId = null;
      } catch {
        customerId = null;
      }
    }

    if (!customerId) {
      const user = await getCurrentUser();
      // Prefer the authenticated identity; camps.director_email is signup-time
      // free text and is not guaranteed to match the person paying.
      const email = user?.email ?? (await getCampDirectorEmail(camp.campId)) ?? undefined;

      const customer = await stripe.customers.create({
        email,
        name: camp.campName,
        metadata: {
          camp_id: camp.campId,
          camp_slug: camp.slug,
        },
      });
      customerId = customer.id;
      await setCampStripeCustomerId(camp.campId, customerId);
    }

    // ---- 6. The Checkout Session ------------------------------------------
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity }],
      client_reference_id: camp.campId,
      metadata: {
        camp_id: camp.campId,
        camp_slug: camp.slug,
        plan,
      },
      subscription_data: {
        // customer.subscription.* events do not carry the session's metadata,
        // so stamp the subscription itself. The webhook reads this first.
        metadata: {
          camp_id: camp.campId,
          camp_slug: camp.slug,
          plan,
        },
      },
      allow_promotion_codes: true,
      success_url: `${siteUrl}/billing?checkout=complete&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/billing?checkout=cancelled`,
    });

    if (!session.url) {
      // Stripe accepted the session but gave us nowhere to send the director.
      // Returning the id alone would look like success; it is not.
      return NextResponse.json(
        { success: false, error: "Stripe did not return a checkout URL. No charge was attempted." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      session_id: session.id,
      checkout_url: session.url,
      plan,
      quantity,
      unit_price_usd: BILLING_PLANS[plan].unitPriceUsd,
    });
  } catch (err) {
    if (isBillingSetupIncomplete(err)) {
      return NextResponse.json(
        { success: false, error: "setup_incomplete", message: "Billing tables are missing. Apply the migrations." },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    console.error("[stripe] checkout failed", message);
    return NextResponse.json(
      { success: false, error: "checkout_failed", message },
      { status: 500 }
    );
  }
}

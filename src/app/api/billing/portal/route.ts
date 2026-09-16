import { NextResponse } from "next/server";

import { getCurrentCamp, isSetupIncompleteError } from "@/lib/auth";
import { getSiteUrl, getStripe, isStripeNotConfiguredError } from "@/lib/stripe";
import { getCampStripeCustomerId, isBillingSetupIncomplete } from "@/app/api/billing/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/portal
 *
 * Opens the Stripe Billing Portal for the signed-in director's camp, where
 * they can update the card, read invoices, or cancel. Stripe hosts and
 * authenticates that surface; we only hand it a customer id.
 *
 * The customer id comes from the session's camp, never from the request body.
 * Accepting a customer id from the client would hand any signed-in user a
 * portal session for any camp's billing account.
 */
export async function POST() {
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
      { success: false, error: "not_authenticated", message: "Sign in to manage billing." },
      { status: 401 }
    );
  }

  let stripe: ReturnType<typeof getStripe>;
  let siteUrl: string;
  try {
    stripe = getStripe();
    siteUrl = getSiteUrl();
  } catch (err) {
    if (isStripeNotConfiguredError(err)) {
      return NextResponse.json(
        {
          success: false,
          error: "stripe_not_configured",
          message: `Billing is not configured yet (${err.missingEnvVar} is unset).`,
        },
        { status: 503 }
      );
    }
    throw err;
  }

  try {
    const customerId = await getCampStripeCustomerId(camp.campId);
    if (!customerId) {
      // No Stripe customer means this camp has never started checkout. There
      // is nothing to manage, and inventing a customer here would create a
      // billing account the director never agreed to.
      return NextResponse.json(
        {
          success: false,
          error: "no_billing_account",
          message: "This camp has no billing account yet. Start a subscription first.",
        },
        { status: 409 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/billing`,
    });

    return NextResponse.json({ success: true, portal_url: session.url });
  } catch (err) {
    if (isBillingSetupIncomplete(err)) {
      return NextResponse.json(
        { success: false, error: "setup_incomplete", message: "Billing tables are missing. Apply the migrations." },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : "Could not open the billing portal.";
    console.error("[stripe] portal failed", message);
    return NextResponse.json({ success: false, error: "portal_failed", message }, { status: 500 });
  }
}

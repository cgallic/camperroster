import { NextResponse } from "next/server";

/**
 * Stripe checkout.
 *
 * There is no live Stripe integration behind this route yet. It must never
 * fabricate a session id or hand back a URL that implies a payment succeeded.
 * Until STRIPE_SECRET_KEY is configured AND the TODO block below is
 * implemented against the real Stripe API, this endpoint fails closed.
 */
export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { success: false, error: "Payments are not configured yet." },
      { status: 503 }
    );
  }

  // TODO(payments): implement the real Stripe Checkout Session creation here.
  //   import Stripe from "stripe";
  //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  //   const session = await stripe.checkout.sessions.create({ ... });
  //   return NextResponse.json({ success: true, session_id: session.id, checkout_url: session.url });
  // Until that exists, throwing is correct: a fabricated session id would tell a
  // camp director money moved when it did not.
  throw new Error("Stripe checkout is not implemented.");
}

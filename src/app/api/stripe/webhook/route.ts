import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/server";
import { stripeClient, webhookSecret } from "@/lib/stripe";
import { recomputeInvoiceTotals } from "@/lib/invoicing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Distinguishes our claims in stripe_events from the subscription webhook's. */
const HANDLER = "tuition";

type Db = ReturnType<typeof createAdminClient>;

/**
 * Stripe's side of the conversation.
 *
 * Two rules hold this together. The signature is checked against the raw body,
 * because anything that has been through `JSON.parse` no longer hashes to what
 * Stripe signed. And the event id is claimed in `stripe_events` before any work
 * happens, so Stripe's at-least-once delivery cannot apply the same payment
 * twice.
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripeClient().webhooks.constructEventAsync(raw, signature, webhookSecret());
  } catch {
    // Never echo the reason: it can leak whether a secret is configured.
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const db = createAdminClient();

  // Claim the event first. A duplicate trips the (id, handler) key and we stop.
  //
  // The camp-subscription webhook at /api/billing/webhook receives these same
  // events and claims them too. Claiming under our own handler is what stops one
  // integration reading the other's claim as an already-processed replay and
  // returning 200 to a payment it never settled.
  const { error: claimError } = await db
    .from("stripe_events")
    .insert({ id: event.id, type: event.type, handler: HANDLER });
  if (claimError) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutCompleted(db, event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.succeeded":
        await onIntentSucceeded(db, event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await onIntentFailed(db, event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await onChargeRefunded(db, event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }
  } catch (err) {
    // Release the claim so Stripe's retry can have another go at it.
    await db.from("stripe_events").delete().eq("id", event.id).eq("handler", HANDLER);
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Handlers -----------------------------------------------------------------------

type PaymentRow = {
  id: string;
  invoice_id: string;
  schedule_item_id: string | null;
  amount_cents: number;
  refunded_cents: number;
};

const PAYMENT_COLUMNS = "id, invoice_id, schedule_item_id, amount_cents, refunded_cents, status";

async function paymentBySession(db: Db, sessionId: string): Promise<PaymentRow | null> {
  const { data } = await db
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  return (data as PaymentRow | null) ?? null;
}

async function paymentByIntent(db: Db, intentId: string): Promise<PaymentRow | null> {
  const { data } = await db
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .eq("stripe_payment_intent_id", intentId)
    .maybeSingle();
  return (data as PaymentRow | null) ?? null;
}

/**
 * Finds the row when `payment_intent.succeeded` arrives before
 * `checkout.session.completed` has had a chance to write the intent id.
 *
 * The session's own id is not on the intent, so the match is made through the
 * metadata the checkout route attaches to `payment_intent_data`: the invoice,
 * and the instalment when there is one.
 */
async function paymentByIntentMetadata(db: Db, intent: Stripe.PaymentIntent): Promise<PaymentRow | null> {
  const invoiceId = intent.metadata?.invoice_id;
  if (!invoiceId) return null;

  const scheduleItemId = intent.metadata?.schedule_item_id;

  let query = db
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .eq("invoice_id", invoiceId)
    .eq("status", "pending")
    .is("stripe_payment_intent_id", null);

  query = scheduleItemId
    ? query.eq("schedule_item_id", scheduleItemId)
    : query.is("schedule_item_id", null);

  // Newest first: a family who abandoned one checkout and started another
  // should settle against the attempt Stripe is telling us about.
  const { data } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data as PaymentRow | null) ?? null;
}

type PaymentPatch = {
  stripe_payment_intent_id?: string | null;
  amount_cents?: number;
  status?: "pending" | "succeeded" | "failed" | "refunded" | "partially_refunded";
  failure_reason?: string | null;
  paid_at?: string | null;
};

async function settle(
  db: Db,
  payment: PaymentRow,
  patch: PaymentPatch,
  scheduleStatus: "paid" | "failed" | null,
) {
  await db.from("payments").update(patch).eq("id", payment.id);
  if (scheduleStatus && payment.schedule_item_id) {
    await db
      .from("payment_schedule_items")
      .update({ status: scheduleStatus })
      .eq("id", payment.schedule_item_id);
  }
  // Recomputed from the payments rows, never incremented — see invoicing.ts.
  await recomputeInvoiceTotals(db, payment.invoice_id);
}

async function onCheckoutCompleted(db: Db, session: Stripe.Checkout.Session) {
  const payment = await paymentBySession(db, session.id);
  if (!payment) return; // Not one of ours.

  const intentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const paid = session.payment_status === "paid";

  await settle(
    db,
    payment,
    {
      stripe_payment_intent_id: intentId,
      // What Stripe says was collected wins over what we asked for.
      amount_cents: session.amount_total ?? payment.amount_cents,
      status: paid ? "succeeded" : "pending",
      paid_at: paid ? new Date().toISOString() : null,
    },
    paid ? "paid" : null,
  );
}

async function onIntentSucceeded(db: Db, intent: Stripe.PaymentIntent) {
  const payment = (await paymentByIntent(db, intent.id)) ?? (await paymentByIntentMetadata(db, intent));
  if (!payment) return;

  await settle(
    db,
    payment,
    {
      stripe_payment_intent_id: intent.id,
      amount_cents: intent.amount_received || intent.amount || payment.amount_cents,
      status: "succeeded",
      failure_reason: null,
      paid_at: new Date().toISOString(),
    },
    "paid",
  );
}

async function onIntentFailed(db: Db, intent: Stripe.PaymentIntent) {
  const payment = await paymentByIntent(db, intent.id);
  if (!payment) return;

  await settle(
    db,
    payment,
    {
      status: "failed",
      failure_reason: intent.last_payment_error?.message ?? "The card was declined",
      paid_at: null,
    },
    // The instalment stays owed; it is marked failed so the camp can chase it.
    "failed",
  );
}

async function onChargeRefunded(db: Db, charge: Stripe.Charge) {
  const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!intentId) return;
  const payment = await paymentByIntent(db, intentId);
  if (!payment) return;

  // Stripe reports the running total refunded, so this is a set, not an add.
  const refunded = charge.amount_refunded ?? 0;
  const full = refunded >= payment.amount_cents;

  await db
    .from("payments")
    .update({
      refunded_cents: refunded,
      status: full ? "refunded" : refunded > 0 ? "partially_refunded" : "succeeded",
    })
    .eq("id", payment.id);

  // A fully refunded instalment is owed again; a partial one still stands.
  if (full && payment.schedule_item_id) {
    await db
      .from("payment_schedule_items")
      .update({ status: "scheduled" })
      .eq("id", payment.schedule_item_id);
  }

  await recomputeInvoiceTotals(db, payment.invoice_id);
}

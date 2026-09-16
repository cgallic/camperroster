import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/server";
import { stripeClient } from "@/lib/stripe";
import { recomputeInvoiceTotals } from "@/lib/invoicing";
import { requireFinanceAdmin, badRequest } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  paymentId: z.string().uuid(),
  /** Omit to refund everything still refundable on that payment. */
  amountCents: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
});

/**
 * Refund a family — a camper backing out, usually.
 *
 * The refund is issued against the payment intent and the local rows are only
 * written after Stripe confirms, so a failure here never leaves the camp's
 * books showing money returned that was not. `charge.refunded` arrives shortly
 * afterwards and recomputes the same totals; both paths derive rather than
 * increment, so the second one is harmless.
 */
export async function POST(req: Request) {
  const guard = await requireFinanceAdmin();
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("paymentId is required");
  const { paymentId, amountCents, reason } = parsed.data;

  const db = createAdminClient();

  const { data: payment, error } = await db
    .from("payments")
    .select("id, camp_id, invoice_id, schedule_item_id, amount_cents, refunded_cents, status, stripe_payment_intent_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!payment) return NextResponse.json({ error: "No such payment" }, { status: 404 });
  if (payment.camp_id !== guard.membership.campId) {
    return NextResponse.json({ error: "That payment belongs to another camp" }, { status: 403 });
  }
  if (!["succeeded", "partially_refunded"].includes(payment.status)) {
    return badRequest("Only a settled payment can be refunded");
  }

  const refundable = payment.amount_cents - (payment.refunded_cents ?? 0);
  if (refundable <= 0) return badRequest("This payment has already been refunded in full");

  const amount = amountCents ?? refundable;
  if (amount > refundable) return badRequest("That is more than is left on this payment");

  if (!payment.stripe_payment_intent_id) {
    return badRequest("This payment has no Stripe charge to refund — reverse it as an offline adjustment");
  }

  try {
    await stripeClient().refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      amount,
      metadata: { invoice_id: payment.invoice_id, refunded_by: guard.userId, note: reason ?? "" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe refused the refund";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const refundedTotal = (payment.refunded_cents ?? 0) + amount;
  const full = refundedTotal >= payment.amount_cents;

  await db
    .from("payments")
    .update({
      refunded_cents: refundedTotal,
      status: full ? "refunded" : "partially_refunded",
      failure_reason: reason ?? null,
    })
    .eq("id", payment.id);

  // A fully refunded instalment goes back on the books as owed.
  if (full && payment.schedule_item_id) {
    await db
      .from("payment_schedule_items")
      .update({ status: "scheduled" })
      .eq("id", payment.schedule_item_id);
  }

  await recomputeInvoiceTotals(db, payment.invoice_id);

  return NextResponse.json({ refundedCents: amount, totalRefundedCents: refundedTotal, full });
}

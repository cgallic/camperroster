import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/server";
import { stripeClient, siteUrl } from "@/lib/stripe";
import { INVOICE_COLUMNS, type InvoiceRow } from "@/lib/invoicing";
import { formatCents } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Start a real Stripe Checkout Session for one instalment on a family's
 * invoice.
 *
 * Reached both by a signed-in parent and by public intake straight after
 * registration, so it runs on the admin client — parents have no `camp_members`
 * row and RLS would otherwise hide their own invoice from them. The amount is
 * therefore read from the invoice and its schedule every time; nothing the
 * caller sends is allowed to decide what gets charged.
 */
const BodySchema = z.object({
  invoiceId: z.string().uuid(),
  scheduleItemId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
  }
  const { invoiceId, scheduleItemId } = parsed.data;

  const db = createAdminClient();

  const { data: invoiceRow, error: invoiceError } = await db
    .from("family_invoices")
    .select(INVOICE_COLUMNS)
    .eq("id", invoiceId)
    .maybeSingle();
  if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 });
  if (!invoiceRow) return NextResponse.json({ error: "No such invoice" }, { status: 404 });
  const invoice = invoiceRow as unknown as InvoiceRow;

  const outstanding = Math.max(0, invoice.total_due_cents - invoice.amount_paid_cents);
  if (outstanding <= 0) {
    return NextResponse.json({ error: "This invoice is already paid in full" }, { status: 400 });
  }

  // Which instalment is being paid: the one asked for, else the next one due.
  let item: { id: string; amount_cents: number; due_on: string } | null = null;
  if (scheduleItemId) {
    const { data } = await db
      .from("payment_schedule_items")
      .select("id, amount_cents, due_on, status, invoice_id")
      .eq("id", scheduleItemId)
      .maybeSingle();
    if (!data || data.invoice_id !== invoiceId) {
      return NextResponse.json({ error: "That payment is not on this invoice" }, { status: 400 });
    }
    if (data.status === "paid" || data.status === "waived") {
      return NextResponse.json({ error: "That payment has already been settled" }, { status: 400 });
    }
    item = { id: data.id, amount_cents: data.amount_cents, due_on: data.due_on };
  } else {
    const { data } = await db
      .from("payment_schedule_items")
      .select("id, amount_cents, due_on")
      .eq("invoice_id", invoiceId)
      .in("status", ["scheduled", "late", "failed"])
      .order("due_on", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) item = { id: data.id, amount_cents: data.amount_cents, due_on: data.due_on };
  }

  // Server-derived, always. An instalment can never exceed what is still owed.
  const amountCents = Math.min(item ? item.amount_cents : outstanding, outstanding);
  if (amountCents <= 0) {
    return NextResponse.json({ error: "There is nothing due right now" }, { status: 400 });
  }

  const { data: family } = await db
    .from("families")
    .select("household_name")
    .eq("id", invoice.family_id)
    .maybeSingle();
  const household = family?.household_name ?? "Camp tuition";

  const base = siteUrl();

  let session;
  try {
    session = await stripeClient().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `${household} — camp tuition`,
              description: item
                ? `Payment due ${item.due_on} (${formatCents(amountCents)})`
                : `Balance due (${formatCents(amountCents)})`,
            },
          },
        },
      ],
      success_url: `${base}/portal?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/portal?paid=0`,
      // The webhook has no session of its own; this is how it finds its way
      // back to the right rows.
      metadata: {
        invoice_id: invoice.id,
        camp_id: invoice.camp_id,
        family_id: invoice.family_id,
        schedule_item_id: item?.id ?? "",
      },
      payment_intent_data: {
        metadata: {
          invoice_id: invoice.id,
          camp_id: invoice.camp_id,
          schedule_item_id: item?.id ?? "",
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe refused the request";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Recorded before the family leaves the site, so a completed payment always
  // has a row waiting for the webhook to settle.
  const { error: paymentError } = await db.from("payments").insert({
    camp_id: invoice.camp_id,
    invoice_id: invoice.id,
    schedule_item_id: item?.id ?? null,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    amount_cents: amountCents,
    status: "pending",
  });
  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  return NextResponse.json({
    sessionId: session.id,
    checkoutUrl: session.url,
    amountCents,
    scheduleItemId: item?.id ?? null,
  });
}

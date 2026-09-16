import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/server";
import { recomputeInvoiceTotals } from "@/lib/invoicing";
import { requireFinanceAdmin, badRequest } from "../../../stripe/_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  invoiceId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  method: z.enum(["cash", "check", "other"]).default("check"),
  note: z.string().max(200).optional(),
});

/**
 * Record cash or a check handed over at the office.
 *
 * It lands in `payments` like any other payment, just with no Stripe ids, so
 * the balance, the outstanding list and the family's history all stay in one
 * place. The oldest instalment still owing is marked paid, since that is the
 * one a family is settling when they write a check.
 */
export async function POST(req: Request) {
  const guard = await requireFinanceAdmin();
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("invoiceId and a positive amountCents are required");
  const { invoiceId, amountCents, method, note } = parsed.data;

  const db = createAdminClient();

  const { data: invoice } = await db
    .from("family_invoices")
    .select("id, camp_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) return NextResponse.json({ error: "No such invoice" }, { status: 404 });
  if (invoice.camp_id !== guard.membership.campId) {
    return NextResponse.json({ error: "That invoice belongs to another camp" }, { status: 403 });
  }

  const { data: nextItem } = await db
    .from("payment_schedule_items")
    .select("id, amount_cents")
    .eq("invoice_id", invoiceId)
    .in("status", ["scheduled", "late", "failed"])
    .order("due_on", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Only close out an instalment the payment actually covers.
  const coversItem = nextItem ? amountCents >= nextItem.amount_cents : false;

  const { error } = await db.from("payments").insert({
    camp_id: invoice.camp_id,
    invoice_id: invoiceId,
    schedule_item_id: coversItem ? nextItem!.id : null,
    amount_cents: amountCents,
    status: "succeeded",
    paid_at: new Date().toISOString(),
    method,
    note: note || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (coversItem) {
    await db.from("payment_schedule_items").update({ status: "paid" }).eq("id", nextItem!.id);
  }

  await recomputeInvoiceTotals(db, invoiceId);

  return NextResponse.json({ recordedCents: amountCents, closedScheduleItem: coversItem });
}

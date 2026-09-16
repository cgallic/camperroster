import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/server";
import { INVOICE_COLUMNS, regenerateSchedule, type InvoiceRow } from "@/lib/invoicing";
import { requireFinanceAdmin, badRequest } from "../../../stripe/_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  invoiceId: z.string().uuid(),
  /** null clears the override and puts the family back on the published tier. */
  customTotalCents: z.number().int().min(0).nullable(),
});

/**
 * Set (or clear) the hand-priced total for a family the published tiers do not
 * cover. `total_due_cents` is generated in the database, so only the override
 * is written here and the schedule is rebuilt around whatever comes back.
 */
export async function POST(req: Request) {
  const guard = await requireFinanceAdmin();
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("invoiceId and customTotalCents are required");

  const db = createAdminClient();
  const { data, error } = await db
    .from("family_invoices")
    .update({ custom_total_cents: parsed.data.customTotalCents, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.invoiceId)
    .eq("camp_id", guard.membership.campId)
    .select(INVOICE_COLUMNS)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No such invoice" }, { status: 404 });

  const invoice = data as unknown as InvoiceRow;
  await regenerateSchedule(db, invoice);

  return NextResponse.json({ invoice });
}

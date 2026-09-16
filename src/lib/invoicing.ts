/**
 * Server-side invoicing: pricing a household for a season, and keeping its
 * payment schedule in step with whatever plan it is on.
 *
 * The tier lookup itself lives in the database (`family_tuition_cents`) so the
 * rate that gets charged and the rate the camp published can never disagree.
 * This module handles the parts around it: counting the family, applying an
 * awarded grant, optionally passing on card fees, and dating the instalments.
 */

import { createAdminClient } from "@/lib/supabase/server";
import {
  buildSchedule,
  processingFeeCents,
  toIsoDate,
  type IsoDate,
  type PaymentPlan,
  type ScheduleItem,
} from "@/lib/pricing";

type Db = ReturnType<typeof createAdminClient>;

export type InvoiceRow = {
  id: string;
  camp_id: string;
  season_id: string;
  family_id: string;
  camper_count: number;
  tier_cents: number;
  custom_total_cents: number | null;
  financial_aid_cents: number;
  processing_fee_cents: number;
  amount_paid_cents: number;
  amount_refunded_cents: number;
  payment_plan: PaymentPlan;
  total_due_cents: number;
};

export const INVOICE_COLUMNS =
  "id, camp_id, season_id, family_id, camper_count, tier_cents, custom_total_cents, " +
  "financial_aid_cents, processing_fee_cents, amount_paid_cents, amount_refunded_cents, " +
  "payment_plan, priced_at, total_due_cents";

/**
 * Whether this camp adds card fees to what families pay. There is no per-camp
 * column for it yet, so it is an environment switch the camp flips once.
 */
export function passesFeesOn(): boolean {
  const v = (process.env.PASS_PROCESSING_FEES_TO_FAMILIES ?? "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function today(): IsoDate {
  return toIsoDate(new Date());
}

/** First day of camp for a season's camp, used to date the last instalment. */
export async function campStartsOn(db: Db, campId: string): Promise<IsoDate | null> {
  const { data } = await db
    .from("camp_sessions")
    .select("start_date")
    .eq("camp_id", campId)
    .eq("is_active", true)
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.start_date ? toIsoDate(data.start_date as string) : null;
}

/** Campers attached to this household. The tier is keyed on this count. */
export async function camperCount(db: Db, familyId: string): Promise<number> {
  const { count } = await db
    .from("campers")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId);
  return count ?? 0;
}

/** Aid actually awarded — a pending application discounts nothing. */
export async function awardedAidCents(db: Db, seasonId: string, familyId: string): Promise<number> {
  const { data } = await db
    .from("financial_aid_applications")
    .select("amount_awarded_cents, status")
    .eq("season_id", seasonId)
    .eq("family_id", familyId)
    .maybeSingle();
  if (!data || data.status !== "approved") return 0;
  return Math.max(0, data.amount_awarded_cents ?? 0);
}

export type PriceFamilyOptions = {
  campId: string;
  seasonId: string;
  familyId: string;
  /** Leave unset to keep an existing invoice's plan (or start at pay_in_full). */
  plan?: PaymentPlan;
  /** Admin override for families beyond the published tiers. */
  customTotalCents?: number | null;
  asOf?: IsoDate;
};

/**
 * Create or re-price a household's invoice, then rebuild its schedule.
 *
 * Re-pricing is deliberately idempotent: it recomputes every part from the
 * current campers, tiers and aid rather than adjusting what is there, so a
 * second call after a sibling is added lands on the right number instead of a
 * number that depends on how many times it has run.
 */
export async function priceFamilyInvoice(
  db: Db,
  opts: PriceFamilyOptions,
): Promise<{ invoice: InvoiceRow; schedule: ScheduleItem[] }> {
  const { campId, seasonId, familyId } = opts;
  const asOf = opts.asOf ?? today();

  const { data: existing } = await db
    .from("family_invoices")
    .select(INVOICE_COLUMNS)
    .eq("season_id", seasonId)
    .eq("family_id", familyId)
    .maybeSingle();

  const plan: PaymentPlan =
    opts.plan ?? ((existing?.payment_plan as PaymentPlan | undefined) ?? "pay_in_full");

  const count = await camperCount(db, familyId);

  const { data: tierCents, error: tierError } = await db.rpc("family_tuition_cents", {
    p_season_id: seasonId,
    p_camper_count: Math.max(1, count),
    p_as_of: asOf,
  });
  if (tierError) throw new Error(`Could not price this family: ${tierError.message}`);

  const customTotal =
    opts.customTotalCents !== undefined ? opts.customTotalCents : (existing?.custom_total_cents ?? null);

  const aid = await awardedAidCents(db, seasonId, familyId);
  const base = Math.max(0, (customTotal ?? (tierCents as number | null) ?? 0) - aid);
  const fee = passesFeesOn() ? processingFeeCents(base) : 0;

  const payload = {
    camp_id: campId,
    season_id: seasonId,
    family_id: familyId,
    camper_count: count,
    tier_cents: (tierCents as number | null) ?? 0,
    custom_total_cents: customTotal,
    financial_aid_cents: aid,
    processing_fee_cents: fee,
    payment_plan: plan,
    priced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await db
    .from("family_invoices")
    .upsert(payload, { onConflict: "season_id,family_id" })
    .select(INVOICE_COLUMNS)
    .single();
  if (error) throw new Error(`Could not save this invoice: ${error.message}`);

  const invoice = saved as unknown as InvoiceRow;
  const schedule = await regenerateSchedule(db, invoice);
  return { invoice, schedule };
}

/**
 * Rewrite the instalments for an invoice.
 *
 * Anything already paid, failed or waived is left alone — rewriting history
 * would orphan the payments pointing at it. Only the still-scheduled items are
 * replaced, and they are sized to what is actually left owing.
 */
export async function regenerateSchedule(db: Db, invoice: InvoiceRow): Promise<ScheduleItem[]> {
  const { data: settled } = await db
    .from("payment_schedule_items")
    .select("id, amount_cents, status")
    .eq("invoice_id", invoice.id)
    .neq("status", "scheduled");

  const settledCents = (settled ?? []).reduce(
    (n, s) => n + (s.status === "waived" ? 0 : (s.amount_cents as number)),
    0,
  );

  await db.from("payment_schedule_items").delete().eq("invoice_id", invoice.id).eq("status", "scheduled");

  const remaining = Math.max(0, invoice.total_due_cents - Math.max(settledCents, invoice.amount_paid_cents));
  if (remaining <= 0) return [];

  const { data: season } = await db
    .from("seasons")
    .select("forms_due_on")
    .eq("id", invoice.season_id)
    .maybeSingle();

  const items = buildSchedule({
    plan: invoice.payment_plan,
    totalCents: remaining,
    today: today(),
    campStartsOn: await campStartsOn(db, invoice.camp_id),
    formsDueOn: season?.forms_due_on ? toIsoDate(season.forms_due_on as string) : null,
  });

  if (items.length) {
    const { error } = await db.from("payment_schedule_items").insert(
      items.map((i) => ({
        camp_id: invoice.camp_id,
        invoice_id: invoice.id,
        due_on: i.dueOn,
        amount_cents: i.amountCents,
        status: "scheduled" as const,
      })),
    );
    if (error) throw new Error(`Could not save the payment schedule: ${error.message}`);
  }

  return items;
}

/** Switch an invoice onto a different plan and re-date what is left owing. */
export async function changePaymentPlan(
  db: Db,
  invoiceId: string,
  plan: PaymentPlan,
): Promise<{ invoice: InvoiceRow; schedule: ScheduleItem[] }> {
  const { data, error } = await db
    .from("family_invoices")
    .update({ payment_plan: plan, updated_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .select(INVOICE_COLUMNS)
    .single();
  if (error) throw new Error(`Could not change the payment plan: ${error.message}`);

  const invoice = data as unknown as InvoiceRow;
  return { invoice, schedule: await regenerateSchedule(db, invoice) };
}

/**
 * Recompute what a family has paid and had refunded from the payments rows.
 *
 * Derived, never incremented: a retried webhook or a manual correction would
 * otherwise leave the totals permanently adrift from the payments that back
 * them.
 */
export async function recomputeInvoiceTotals(db: Db, invoiceId: string): Promise<void> {
  const { data: rows, error } = await db
    .from("payments")
    .select("amount_cents, refunded_cents, status")
    .eq("invoice_id", invoiceId);
  if (error) throw new Error(`Could not read this invoice's payments: ${error.message}`);

  let paid = 0;
  let refunded = 0;
  for (const row of rows ?? []) {
    const amount = (row.amount_cents as number) ?? 0;
    const back = (row.refunded_cents as number) ?? 0;
    if (["succeeded", "refunded", "partially_refunded"].includes(row.status as string)) {
      paid += amount - back;
      refunded += back;
    }
  }

  await db
    .from("family_invoices")
    .update({
      amount_paid_cents: Math.max(0, paid),
      amount_refunded_cents: Math.max(0, refunded),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);
}

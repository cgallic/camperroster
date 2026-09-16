import { createClient } from "@/lib/supabase/server";
import type { PaymentPlan } from "@/lib/pricing";
import type { AidApplication, FamilyFinance, PaymentLine, ScheduleLine } from "./types";

/**
 * Everything the finance desk looks at, in four reads. Runs on the
 * request-scoped client, so RLS keeps this to registrars and directors of the
 * caller's own camp.
 */
export async function loadFinance(): Promise<{ families: FamilyFinance[]; aid: AidApplication[] }> {
  const supabase = await createClient();

  const [{ data: invoices }, { data: schedule }, { data: payments }, { data: balances }, { data: aidRows }] =
    await Promise.all([
      supabase
        .from("family_invoices")
        // Single literal so the client can type the rows from the select.
        .select(
          "id, family_id, camper_count, payment_plan, tier_cents, custom_total_cents, financial_aid_cents, processing_fee_cents, amount_paid_cents, amount_refunded_cents, total_due_cents, families(household_name)",
        ),
      supabase
        .from("payment_schedule_items")
        .select("id, invoice_id, due_on, amount_cents, status")
        .order("due_on", { ascending: true }),
      supabase
        .from("payments")
        .select("id, invoice_id, amount_cents, refunded_cents, status, paid_at, method, note, failure_reason, stripe_payment_intent_id")
        .order("paid_at", { ascending: false, nullsFirst: false }),
      supabase.from("outstanding_balances").select("invoice_id, balance_cents, next_due_on"),
      supabase
        .from("financial_aid_applications")
        .select("id, family_id, amount_requested_cents, amount_awarded_cents, status, narrative, decided_at, families(household_name)")
        .order("created_at", { ascending: false }),
    ]);

  const byInvoiceSchedule = new Map<string, ScheduleLine[]>();
  for (const s of schedule ?? []) {
    const list = byInvoiceSchedule.get(s.invoice_id) ?? [];
    list.push({ id: s.id, dueOn: s.due_on, amountCents: s.amount_cents, status: s.status });
    byInvoiceSchedule.set(s.invoice_id, list);
  }

  const byInvoicePayments = new Map<string, PaymentLine[]>();
  for (const p of payments ?? []) {
    const list = byInvoicePayments.get(p.invoice_id) ?? [];
    list.push({
      id: p.id,
      amountCents: p.amount_cents,
      refundedCents: p.refunded_cents ?? 0,
      status: p.status,
      paidAt: p.paid_at,
      method: p.method,
      // failure_reason only carries a message when a card was declined.
      note: p.note ?? p.failure_reason,
      isOffline: !p.stripe_payment_intent_id,
    });
    byInvoicePayments.set(p.invoice_id, list);
  }

  const balanceByInvoice = new Map(
    (balances ?? []).map((b) => [b.invoice_id as string, b as { balance_cents: number; next_due_on: string | null }]),
  );

  const households = (rel: unknown): string => {
    const r = rel as { household_name?: string } | { household_name?: string }[] | null;
    if (Array.isArray(r)) return r[0]?.household_name ?? "Unnamed household";
    return r?.household_name ?? "Unnamed household";
  };

  const families: FamilyFinance[] = (invoices ?? []).map((i) => {
    const outstanding = balanceByInvoice.get(i.id);
    return {
      invoiceId: i.id,
      familyId: i.family_id,
      householdName: households(i.families),
      camperCount: i.camper_count ?? 0,
      plan: (i.payment_plan as PaymentPlan) ?? "pay_in_full",
      tierCents: i.tier_cents ?? 0,
      customTotalCents: i.custom_total_cents,
      financialAidCents: i.financial_aid_cents ?? 0,
      processingFeeCents: i.processing_fee_cents ?? 0,
      totalDueCents: i.total_due_cents ?? 0,
      paidCents: i.amount_paid_cents ?? 0,
      refundedCents: i.amount_refunded_cents ?? 0,
      // The view only carries households that still owe; everyone else is square.
      balanceCents: outstanding?.balance_cents ?? 0,
      nextDueOn: outstanding?.next_due_on ?? null,
      payments: byInvoicePayments.get(i.id) ?? [],
      schedule: byInvoiceSchedule.get(i.id) ?? [],
    };
  });

  families.sort((a, b) => b.balanceCents - a.balanceCents || a.householdName.localeCompare(b.householdName));

  const aid: AidApplication[] = (aidRows ?? []).map((a) => ({
    id: a.id,
    familyId: a.family_id,
    householdName: households(a.families),
    requestedCents: a.amount_requested_cents,
    awardedCents: a.amount_awarded_cents,
    status: a.status,
    narrative: a.narrative,
    decidedAt: a.decided_at,
  }));

  return { families, aid };
}

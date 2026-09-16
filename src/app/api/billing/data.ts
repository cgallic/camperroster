import { supabaseAdmin } from "@/lib/supabase";
import { isSetupIncompleteError } from "@/lib/auth";
import type { BillingPlan } from "@/lib/stripe";

/**
 * Server-only data access for billing.
 *
 * Every function here uses the service-role client (supabaseAdmin) and is
 * therefore NOT protected by RLS. That is deliberate and it is why every
 * single query below filters explicitly on camp_id:
 *
 *   - The Stripe webhook has no user session at all. Its authority comes from
 *     the verified signature, not from a logged-in user, so it cannot use a
 *     cookie-bound client.
 *   - The checkout route must count a camp's registrations authoritatively.
 *     A director's RLS view is the right answer here too, but the count
 *     becomes the billed quantity, so it must not silently shrink if a policy
 *     hides a row from that particular member.
 *
 * The camp_id passed in ALWAYS comes from getCurrentCamp() (server session) or
 * from a signature-verified Stripe object. It is never read from a request
 * body — accepting a camp_id from the client would let anyone bill, read, or
 * cancel another camp's subscription.
 */

/** Statuses that count a registration as a registered camper for billing. */
const BILLABLE_REGISTRATION_STATUSES = ["submitted", "confirmed"] as const;

/** The floor Stripe will accept for a recurring line item quantity. */
export const MIN_BILLED_QUANTITY = 1;

export interface CampSubscriptionRow {
  id: string;
  camp_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  plan: string | null;
  status: string;
  quantity: number | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

/** Statuses in which Stripe considers the camp to be paying. */
const PAID_STATUSES = new Set(["active", "trialing"]);

export function subscriptionIsPaid(row: Pick<CampSubscriptionRow, "status"> | null): boolean {
  return !!row && PAID_STATUSES.has(row.status);
}

/**
 * Count the camp's registered campers. This is the Checkout line-item quantity
 * and therefore the amount the camp is charged — never guess it, never default
 * it to a marketing number.
 *
 * Floored at MIN_BILLED_QUANTITY because Stripe rejects quantity 0 on a
 * subscription line item. A camp that signs up before its first registration
 * is billed for one camper until the count catches up.
 */
export async function countRegisteredCampers(campId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("camp_id", campId)
    .in("status", [...BILLABLE_REGISTRATION_STATUSES]);

  if (error) throw error;
  return Math.max(MIN_BILLED_QUANTITY, count ?? 0);
}

/** Read the camp's saved Stripe Customer id, if one has been created. */
export async function getCampStripeCustomerId(campId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("camps")
    .select("stripe_customer_id")
    .eq("id", campId)
    .maybeSingle();

  if (error) throw error;
  return (data?.stripe_customer_id as string | null) ?? null;
}

/** Read the director email captured at camp signup. Fallback identity only. */
export async function getCampDirectorEmail(campId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("camps")
    .select("director_email")
    .eq("id", campId)
    .maybeSingle();

  if (error) throw error;
  return (data?.director_email as string | null) ?? null;
}

/** Persist the Stripe Customer id so the next checkout reuses it. */
export async function setCampStripeCustomerId(campId: string, customerId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("camps")
    .update({ stripe_customer_id: customerId })
    .eq("id", campId);

  if (error) throw error;
}

/** Reverse lookup used by webhook events that carry only a customer id. */
export async function findCampIdByStripeCustomerId(customerId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("camps")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) throw error;
  return (data?.id as string | null) ?? null;
}

/**
 * The subscription row the /billing page shows. Prefers a live subscription;
 * falls back to the most recently updated row so a canceled camp still sees
 * what happened rather than an empty page.
 */
export async function getCampSubscription(campId: string): Promise<CampSubscriptionRow | null> {
  const { data, error } = await supabaseAdmin
    .from("camp_subscriptions")
    .select("*")
    .eq("camp_id", campId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as CampSubscriptionRow[];
  return rows.find((row) => subscriptionIsPaid(row)) ?? rows[0] ?? null;
}

export interface SubscriptionUpsert {
  campId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
  stripePriceId: string | null;
  plan: BillingPlan | null;
  status: string;
  quantity: number | null;
  /** ISO-8601, derived from the subscription item's current_period_end. */
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Write the camp's subscription state. This — and only this — is what marks a
 * camp as paid, and it is only ever reached from a signature-verified webhook.
 * Keyed on stripe_subscription_id so replays and out-of-order deliveries
 * converge on the same row instead of stacking duplicates.
 */
export async function upsertCampSubscription(input: SubscriptionUpsert): Promise<void> {
  const { error } = await supabaseAdmin
    .from("camp_subscriptions")
    .upsert(
      {
        camp_id: input.campId,
        stripe_subscription_id: input.stripeSubscriptionId,
        stripe_customer_id: input.stripeCustomerId,
        stripe_price_id: input.stripePriceId,
        plan: input.plan,
        status: input.status,
        quantity: input.quantity,
        current_period_end: input.currentPeriodEnd,
        cancel_at_period_end: input.cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    );

  if (error) throw error;
}

// ---- Webhook idempotency ----------------------------------------------------

/** Postgres unique_violation, surfaced by PostgREST as code "23505". */
const UNIQUE_VIOLATION = "23505";

/**
 * Claim a Stripe event id. Returns false when this event was already claimed,
 * i.e. Stripe is replaying and the handler must no-op.
 *
 * The claim is taken BEFORE the handler runs so two concurrent deliveries of
 * the same event cannot both process it. If the handler then fails, the caller
 * must call releaseStripeEvent() so Stripe's retry is not swallowed.
 */
export async function claimStripeEvent(eventId: string, type: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("stripe_events")
    .insert({ id: eventId, type });

  if (!error) return true;
  if (error.code === UNIQUE_VIOLATION) return false;
  throw error;
}

/** Release a claim so a failed event can be retried by Stripe. */
export async function releaseStripeEvent(eventId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("stripe_events").delete().eq("id", eventId);
  // A failed release is not worth turning a 500 into a different 500; the
  // event stays claimed and is visible in stripe_events for manual replay.
  if (error) console.error("[stripe] could not release event claim", eventId, error.message);
}

/**
 * True when the failure is "the billing migration has not been applied yet"
 * rather than a real error. Mirrors the auth module's setup-incomplete
 * handling so an unmigrated deploy answers 503, not 500.
 */
export function isBillingSetupIncomplete(err: unknown): boolean {
  return isSetupIncompleteError(err);
}

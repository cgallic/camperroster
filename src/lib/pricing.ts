/**
 * Money math for household tuition. Pure functions only — no React, no
 * Supabase, no `Date.now()` hidden inside. Everything a caller needs (today's
 * date, the season's dates) is passed in, so the same numbers can be recomputed
 * later and still come out the same.
 */

export type PaymentPlan = "pay_in_full" | "two_payments" | "monthly";

export const PAYMENT_PLANS: PaymentPlan[] = ["pay_in_full", "two_payments", "monthly"];

export function isPaymentPlan(value: unknown): value is PaymentPlan {
  return typeof value === "string" && (PAYMENT_PLANS as string[]).includes(value);
}

/** Stripe's US card rate. Kept here so the two places that need it agree. */
export const STRIPE_PERCENT = 0.029;
export const STRIPE_FIXED_CENTS = 30;

/** An ISO `YYYY-MM-DD` date. Dates are handled as strings to dodge timezones. */
export type IsoDate = string;

export type ScheduleItem = { dueOn: IsoDate; amountCents: number };

// Dates ------------------------------------------------------------------------

export function toIsoDate(value: Date | string): IsoDate {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function parts(date: IsoDate): { y: number; m: number; d: number } {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Same day-of-month `n` months on, clamped to the length of the target month so
 * the 31st never silently becomes the 1st of the month after.
 */
export function addMonths(date: IsoDate, n: number): IsoDate {
  const { y, m, d } = parts(date);
  const total = (y * 12 + (m - 1)) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return `${String(ny).padStart(4, "0")}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}

export function addDays(date: IsoDate, n: number): IsoDate {
  const { y, m, d } = parts(date);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function compareDates(a: IsoDate, b: IsoDate): number {
  return a.slice(0, 10) < b.slice(0, 10) ? -1 : a.slice(0, 10) > b.slice(0, 10) ? 1 : 0;
}

/** Whole months from `a` to `b`, floored (partial months do not count). */
export function monthsBetween(a: IsoDate, b: IsoDate): number {
  const from = parts(a);
  const to = parts(b);
  let n = (to.y - from.y) * 12 + (to.m - from.m);
  if (to.d < from.d) n -= 1;
  return n;
}

// Rates --------------------------------------------------------------------------

/**
 * Which published rate is in force. Mirrors `family_tuition_cents` so a price
 * shown before checkout matches the one the database charges.
 */
export function rateInForce(asOf: IsoDate, earlyRateEndsOn: IsoDate | null): "early" | "regular" {
  if (!earlyRateEndsOn) return "regular";
  return compareDates(asOf, earlyRateEndsOn) < 0 ? "early" : "regular";
}

export function tierPriceCents(
  tier: { early_cents: number; regular_cents: number },
  asOf: IsoDate,
  earlyRateEndsOn: IsoDate | null,
): number {
  return rateInForce(asOf, earlyRateEndsOn) === "early" ? tier.early_cents : tier.regular_cents;
}

// Processing fees ------------------------------------------------------------------

/**
 * What the family must be charged so the camp still nets `netCents` after
 * Stripe takes its cut.
 *
 * The naive `net * 1.029` is wrong: Stripe's fee is taken on the *charged*
 * amount, not on the tuition, so the fee is charged on the fee too. Solving
 * `gross - (gross * rate + fixed) = net` gives `gross = (net + fixed) / (1 - rate)`.
 * Rounded up, because rounding down leaves the camp a cent short.
 */
export function grossUpCents(
  netCents: number,
  percent = STRIPE_PERCENT,
  fixedCents = STRIPE_FIXED_CENTS,
): number {
  if (netCents <= 0) return 0;
  return Math.ceil((netCents + fixedCents) / (1 - percent));
}

/** The pass-through surcharge: the gross-up, less the tuition itself. */
export function processingFeeCents(
  netCents: number,
  percent = STRIPE_PERCENT,
  fixedCents = STRIPE_FIXED_CENTS,
): number {
  if (netCents <= 0) return 0;
  return grossUpCents(netCents, percent, fixedCents) - netCents;
}

/** What Stripe will actually deduct from a charge of `grossCents`. Informational. */
export function stripeFeeOnCharge(
  grossCents: number,
  percent = STRIPE_PERCENT,
  fixedCents = STRIPE_FIXED_CENTS,
): number {
  if (grossCents <= 0) return 0;
  return Math.round(grossCents * percent) + fixedCents;
}

// Splitting ------------------------------------------------------------------------

/**
 * Split cents into `n` parts that sum back exactly to the total. The remainder
 * lands on the earliest parts, so the last payment is never the odd one.
 */
export function splitCents(totalCents: number, n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [totalCents];
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

// Schedules ------------------------------------------------------------------------

export type ScheduleInput = {
  plan: PaymentPlan;
  totalCents: number;
  /** The day the schedule is being built — the first instalment falls due then. */
  today: IsoDate;
  /** First day of camp. Monthly instalments all fall due before it. */
  campStartsOn?: IsoDate | null;
  /** Fallback deadline when the camp's start date is unknown. */
  formsDueOn?: IsoDate | null;
  /** Cap on monthly instalments, so a year-out registration is not 14 payments. */
  maxMonthlyPayments?: number;
};

/** The last day an instalment may fall due: the day before camp, or forms-due. */
export function finalDueDate(input: Pick<ScheduleInput, "today" | "campStartsOn" | "formsDueOn">): IsoDate {
  const { today, campStartsOn, formsDueOn } = input;
  const candidate = campStartsOn ? addDays(campStartsOn, -1) : (formsDueOn ?? addMonths(today, 1));
  return compareDates(candidate, today) <= 0 ? today : candidate;
}

/**
 * Turn a plan and a total into dated instalments that sum to the total exactly.
 *
 * - pay_in_full: one item, due today.
 * - two_payments: halves — today, and the final due date.
 * - monthly: equal monthly items starting today, the last one on or before the
 *   final due date. A family registering too late for even one full month gets
 *   a single payment rather than an instalment falling due after camp.
 */
export function buildSchedule(input: ScheduleInput): ScheduleItem[] {
  const { plan, totalCents, today } = input;
  if (totalCents <= 0) return [];

  const last = finalDueDate(input);

  if (plan === "pay_in_full") {
    return [{ dueOn: today, amountCents: totalCents }];
  }

  if (plan === "two_payments") {
    if (compareDates(last, today) <= 0) return [{ dueOn: today, amountCents: totalCents }];
    const [first, second] = splitCents(totalCents, 2);
    return [
      { dueOn: today, amountCents: first },
      { dueOn: last, amountCents: second },
    ];
  }

  // monthly
  const cap = input.maxMonthlyPayments ?? 12;
  const count = Math.max(1, Math.min(cap, monthsBetween(today, last) + 1));
  const amounts = splitCents(totalCents, count);
  return amounts.map((amountCents, i) => ({ dueOn: addMonths(today, i), amountCents }));
}

/** Sum of a schedule — handy for asserting it still matches the invoice total. */
export function scheduleTotalCents(items: readonly ScheduleItem[]): number {
  return items.reduce((n, i) => n + i.amountCents, 0);
}

// Display ---------------------------------------------------------------------------

export function formatCents(cents: number | null | undefined): string {
  const n = typeof cents === "number" ? cents : 0;
  const sign = n < 0 ? "-" : "";
  return `${sign}$${(Math.abs(n) / 100).toFixed(2)}`;
}

export const PLAN_LABELS: Record<PaymentPlan, string> = {
  pay_in_full: "Paid in full",
  two_payments: "Two payments",
  monthly: "Monthly",
};

/** Balance still owed on an invoice, never negative. */
export function balanceCents(invoice: {
  total_due_cents?: number | null;
  amount_paid_cents?: number | null;
}): number {
  return Math.max(0, (invoice.total_due_cents ?? 0) - (invoice.amount_paid_cents ?? 0));
}

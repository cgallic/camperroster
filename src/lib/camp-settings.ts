/**
 * Validation and money conversion for the director's camp settings page.
 *
 * Pure functions only — no Next, no Supabase — so the rules the server actions
 * enforce can be tested directly. The UI talks in dollars; the database stores
 * cents. Every conversion goes through `dollarsToCents` so "$1,250.5" and
 * "1250.50" land on the same integer.
 */

import { z } from "zod";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; message: string };

/** The family sizes the camp publishes prices for. Larger families get a custom total. */
export const TIER_CAMPER_COUNTS = [1, 2, 3, 4] as const;

/** Lowest and highest grade a session can admit. -1 is Pre-K, 0 is Kindergarten. */
export const MIN_GRADE = -1;
export const MAX_GRADE = 12;

// Money -------------------------------------------------------------------------

/**
 * "$1,250.50" -> 125050. Returns null for anything that is not a non-negative
 * amount with at most two decimal places. Parsed as text, never via float
 * multiplication, so 19.99 does not become 1998.
 */
export function dollarsToCents(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  const text = String(input).trim().replace(/^\$/, "").replace(/,/g, "").trim();
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(text);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const cents = whole * 100 + fraction;
  return Number.isSafeInteger(cents) && cents <= 2_000_000_000 ? cents : null;
}

/** 125050 -> "1250.50", the value an input box shows. */
export function centsToDollars(cents: number | null | undefined): string {
  const n = typeof cents === "number" && Number.isFinite(cents) ? Math.round(cents) : 0;
  return (n / 100).toFixed(2);
}

const money = (label: string) =>
  z.union([z.string(), z.number()]).transform((value, ctx) => {
    const cents = dollarsToCents(value);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: `${label} must be a dollar amount like 350 or 350.00.` });
      return z.NEVER;
    }
    return cents;
  });

// Shared field rules ---------------------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

const isoDate = (label: string) =>
  z.string().trim().refine(isIsoDate, { message: `${label} must be a valid date.` });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const required = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Some fields are not valid.";
}

function parseWith<T>(schema: z.ZodType<T>, input: unknown): ParseResult<T> {
  const parsed = schema.safeParse(input);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, message: firstIssue(parsed.error) };
}

// Camp details -----------------------------------------------------------------------

export const campDetailsSchema = z.object({
  name: required("Camp name"),
  location: optionalText(200),
  director_name: required("Director name"),
  director_email: z.string().trim().toLowerCase().email("Director email must be a valid email address."),
  director_phone: optionalText(40),
  logo_url: optionalText(500).refine((value) => value === null || /^https:\/\/\S+$/i.test(value), {
    message: "Logo URL must start with https://.",
  }),
  primary_color: optionalText(20).refine((value) => value === null || /^#[0-9a-f]{6}$/i.test(value), {
    message: "Brand colour must be a hex colour like #1c3b2f.",
  }),
});

export type CampDetails = z.infer<typeof campDetailsSchema>;

/** Slug is deliberately absent: it is in every public link families already hold. */
export function parseCampDetails(input: unknown): ParseResult<CampDetails> {
  return parseWith(campDetailsSchema, input);
}

// Seasons ------------------------------------------------------------------------------

export const seasonSchema = z.object({
  year: z.coerce.number().int("Year must be a whole number.").min(2000, "Year looks wrong.").max(2100, "Year looks wrong."),
  name: required("Season name"),
  forms_due_on: isoDate("Forms due date"),
  early_rate_ends_on: isoDate("Early-bird end date"),
});

export type SeasonInput = z.infer<typeof seasonSchema>;

export function parseSeason(input: unknown): ParseResult<SeasonInput> {
  return parseWith(seasonSchema, input);
}

// Sessions ------------------------------------------------------------------------------

const grade = (label: string) =>
  z.coerce
    .number()
    .int(`${label} must be a whole grade.`)
    .min(MIN_GRADE, `${label} is out of range.`)
    .max(MAX_GRADE, `${label} is out of range.`);

export const sessionSchema = z
  .object({
    name: required("Session name"),
    start_date: isoDate("Start date"),
    end_date: isoDate("End date"),
    min_grade: grade("Lowest grade"),
    max_grade: grade("Highest grade"),
    capacity: z.coerce.number().int("Capacity must be a whole number.").min(0, "Capacity cannot be negative.").max(100_000),
    price: money("Price"),
    deposit: money("Deposit"),
  })
  .superRefine((value, ctx) => {
    if (value.end_date < value.start_date) {
      ctx.addIssue({ code: "custom", message: "The session cannot end before it starts." });
    }
    if (value.max_grade < value.min_grade) {
      ctx.addIssue({ code: "custom", message: "Highest grade must be at or above the lowest grade." });
    }
    if (value.deposit > value.price) {
      ctx.addIssue({ code: "custom", message: "The deposit cannot be more than the price." });
    }
  })
  .transform((value) => ({
    name: value.name,
    start_date: value.start_date,
    end_date: value.end_date,
    min_grade: value.min_grade,
    max_grade: value.max_grade,
    capacity: value.capacity,
    price_cents: value.price,
    deposit_cents: value.deposit,
  }));

/** The row shape written to `camp_sessions`, money already in cents. */
export type SessionInput = z.infer<typeof sessionSchema>;

export function parseSession(input: unknown): ParseResult<SessionInput> {
  return parseWith(sessionSchema, input);
}

export function gradeLabel(grade: number): string {
  if (grade < 0) return "Pre-K";
  if (grade === 0) return "K";
  return String(grade);
}

// Pricing tiers ---------------------------------------------------------------------------

export type TierInput = { camper_count: number; early_cents: number; regular_cents: number };

const tierRowSchema = z.object({
  camper_count: z.coerce.number().int(),
  early: money("Early-bird price"),
  regular: money("Regular price"),
});

/**
 * Exactly one row for each of 1–4 campers. `family_tuition_cents` falls back to
 * the largest tier at or below the family's size, so a missing row would quietly
 * price a family of four at the three-camper rate instead of failing.
 */
export const tiersSchema = z
  .array(tierRowSchema)
  .superRefine((rows, ctx) => {
    const counts = rows.map((row) => row.camper_count).sort((a, b) => a - b);
    if (counts.join(",") !== TIER_CAMPER_COUNTS.join(",")) {
      ctx.addIssue({ code: "custom", message: "Enter a price for 1, 2, 3 and 4 campers." });
    }
  })
  .transform((rows) =>
    rows
      .map((row) => ({ camper_count: row.camper_count, early_cents: row.early, regular_cents: row.regular }))
      .sort((a, b) => a.camper_count - b.camper_count),
  );

export function parseTiers(input: unknown): ParseResult<TierInput[]> {
  return parseWith(tiersSchema, input);
}

// Database errors -----------------------------------------------------------------------------

/** Turns the Postgres errors a director can actually cause into plain sentences. */
export function friendlyDbError(error: { code?: string | null; message?: string | null }, subject = "That"): string {
  if (error.code === "23505") return `${subject} already exists.`;
  if (error.code === "23514") return `${subject} breaks one of the camp's rules (check dates, grades and amounts).`;
  if (error.code === "42501") return "Only the camp director can change camp settings.";
  return error.message || "The change could not be saved.";
}

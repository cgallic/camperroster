/**
 * The camp's status vocabulary, in one place.
 *
 * Five meanings, one colour each, used identically on every admin screen. If a
 * screen needs a sixth idea, it maps onto one of these — it does not invent a
 * colour. Amber means "waiting on somebody" everywhere, red means "this is late
 * or it failed" everywhere.
 */
export type StatusTone = "complete" | "pending" | "overdue" | "waitlisted" | "neutral";

type ToneStyle = {
  /** The dot itself. */
  dot: string;
  /** Text colour for the label beside the dot. */
  text: string;
  /** Soft background + border, for badges and stat cards. */
  soft: string;
  /** Solid fill, for progress bars. */
  bar: string;
};

export const TONE_STYLES: Record<StatusTone, ToneStyle> = {
  complete: {
    dot: "bg-forest-600",
    text: "text-forest-800",
    soft: "bg-forest-50 text-forest-800 border-forest-100",
    bar: "bg-forest-600",
  },
  pending: {
    dot: "bg-sun-500",
    text: "text-sun-600",
    soft: "bg-sun-50 text-sun-600 border-sun-100",
    bar: "bg-sun-500",
  },
  overdue: {
    dot: "bg-alert-red",
    text: "text-alert-red",
    soft: "bg-alert-red-bg text-alert-red border-alert-red-border",
    bar: "bg-alert-red",
  },
  waitlisted: {
    dot: "bg-blue-500",
    text: "text-blue-700",
    soft: "bg-blue-50 text-blue-700 border-blue-200",
    bar: "bg-blue-500",
  },
  neutral: {
    dot: "bg-stone-300",
    text: "text-stone-600",
    soft: "bg-stone-100 text-stone-600 border-stone-200",
    bar: "bg-stone-300",
  },
};

/**
 * Maps the raw status strings the database uses onto the five tones. Anything
 * unrecognised reads as "not started" grey rather than shouting in a colour it
 * has not earned.
 */
const RAW_TONES: Record<string, StatusTone> = {
  // money
  succeeded: "complete",
  paid: "complete",
  pending: "pending",
  processing: "pending",
  failed: "overdue",
  overdue: "overdue",
  refunded: "neutral",
  partially_refunded: "neutral",
  // paperwork
  approved: "complete",
  complete: "complete",
  completed: "complete",
  submitted: "pending",
  awaiting_review: "pending",
  needs_review: "pending",
  rejected: "overdue",
  expired: "overdue",
  lapsed: "overdue",
  missing: "neutral",
  not_started: "neutral",
  draft: "neutral",
  // mail
  sent: "complete",
  scheduled: "pending",
  cancelled: "neutral",
  // placement
  waitlisted: "waitlisted",
  waiting: "waitlisted",
  offered: "waitlisted",
  accepted: "complete",
  declined: "neutral",
};

export function toneFor(status: string | null | undefined): StatusTone {
  if (!status) return "neutral";
  return RAW_TONES[status.toLowerCase().trim()] ?? "neutral";
}

/** "partially_refunded" -> "partially refunded" */
export function humanizeStatus(status: string): string {
  return status.replace(/_/g, " ");
}

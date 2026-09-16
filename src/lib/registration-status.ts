/**
 * The registration status machine.
 *
 * Every report, every filter and every reminder email in the system reads its
 * idea of "where is this registration up to" from this file, so the rule lives
 * in exactly one place. These are pure functions over plain data: nothing here
 * touches Supabase, the clock is always passed in, and callers are free to run
 * them on the server or ship the inputs to the browser.
 *
 * The camp's rule, in its own words:
 *   - complete            every required document approved AND paid in full
 *   - pending             something outstanding, on or before the forms deadline
 *   - overdue             something outstanding, after the forms deadline
 *   - extension granted   explicitly marked, and it outranks the dates
 */

export const REGISTRATION_STATUSES = ["complete", "pending", "overdue", "extension_granted"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const STATUS_LABELS: Record<RegistrationStatus, string> = {
  complete: "Complete",
  pending: "Pending",
  overdue: "Overdue",
  extension_granted: "Extension granted",
};

/**
 * The camp's exact wording for step one. It is quoted verbatim in the parent
 * portal, in the partial-registration email and on the master workbook, so it
 * is a constant rather than a string typed out three times.
 */
export const PROVISIONAL_HOLD_MESSAGE =
  "Step 1 complete. Your child's spot is being held on a provisional basis. Registration is not complete " +
  "until all medical forms, a PDF copy of insurance, the liability form, and the emergency treatment waiver " +
  "have been submitted.";

/** The four paperwork items the camp names when it describes a provisional hold. */
export const STANDARD_CAMPER_ITEMS = [
  "All medical forms",
  "A PDF copy of insurance",
  "The liability form",
  "The emergency treatment waiver",
] as const;

/** Statuses on `registrations.status` that mean a human granted an extension. */
const EXTENSION_MARKERS = ["extension_granted", "extension", "granted_extension"];

export type DocumentTally = {
  requiredTotal: number;
  requiredApproved: number;
  requiredOutstanding: number;
};

export type OutstandingDocument = {
  /** `document_types.code`, when the caller has the per-document detail. */
  code?: string;
  name: string;
  /** `document_records.status`, or "missing" when no record exists at all. */
  status: string;
};

export type StatusInput = {
  /** Aggregate from the `registration_document_status` view, when available. */
  documents?: DocumentTally | null;
  /** Per-document detail, when the caller loaded it. Drives the checklist. */
  outstandingDocuments?: OutstandingDocument[] | null;
  /** What the household owes, in cents. */
  totalDueCents?: number | null;
  amountPaidCents?: number | null;
  /** `seasons.forms_due_on` — the July 1 line that splits pending from overdue. */
  formsDueOn?: string | Date | null;
  /** Raw `registrations.status`, read only for the extension marker. */
  rawStatus?: string | null;
  /** Set directly when the extension lives somewhere other than `status`. */
  extensionGranted?: boolean;
  /** Defaults to now. Passed in so reports and tests are reproducible. */
  today?: Date;
};

export type StatusResult = {
  status: RegistrationStatus;
  label: string;
  /** Everything still owed, paperwork first, money last. */
  outstanding: string[];
  paidInFull: boolean;
  documentsComplete: boolean;
  balanceCents: number;
  /** Negative once the deadline has passed. */
  daysUntilDeadline: number | null;
  /** The provisional-hold wording, present only while something is outstanding. */
  provisionalHoldMessage: string | null;
};

/** Midnight-normalised date, so a same-day deadline counts as "on or before". */
function startOfDay(value: string | Date): Date {
  const d = typeof value === "string" ? new Date(`${value.slice(0, 10)}T00:00:00`) : new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function isExtensionGranted(input: Pick<StatusInput, "rawStatus" | "extensionGranted">): boolean {
  if (input.extensionGranted) return true;
  const raw = (input.rawStatus ?? "").toLowerCase().trim();
  return EXTENSION_MARKERS.includes(raw);
}

/** Paid in full when nothing is owed. An unpriced registration is not yet paid. */
export function isPaidInFull(totalDueCents?: number | null, amountPaidCents?: number | null): boolean {
  const due = totalDueCents ?? 0;
  const paid = amountPaidCents ?? 0;
  if (due <= 0) return paid > 0 || due === 0;
  return paid >= due;
}

export function balanceCents(totalDueCents?: number | null, amountPaidCents?: number | null): number {
  return Math.max(0, (totalDueCents ?? 0) - (amountPaidCents ?? 0));
}

/**
 * Whether every required document has been approved. "Submitted" is not
 * "approved": the camp's whole reason for tracking documents is that someone
 * looked at them.
 */
export function documentsComplete(input: StatusInput): boolean {
  if (input.outstandingDocuments && input.outstandingDocuments.length > 0) return false;
  const tally = input.documents;
  if (!tally) return (input.outstandingDocuments?.length ?? 0) === 0;
  if (tally.requiredTotal === 0) return true;
  return tally.requiredOutstanding === 0;
}

/**
 * The checklist a registrant sees: what is still missing, in the order the camp
 * reads it out. Falls back to the camp's four standard items when the caller
 * only has the aggregate count.
 */
export function outstandingChecklist(input: StatusInput): string[] {
  const items: string[] = [];

  if (input.outstandingDocuments && input.outstandingDocuments.length > 0) {
    for (const doc of input.outstandingDocuments) {
      items.push(doc.status && doc.status !== "missing" ? `${doc.name} (${doc.status})` : doc.name);
    }
  } else if (!documentsComplete(input)) {
    // Only the count is known, so name the standard four rather than guessing.
    const missing = input.documents?.requiredOutstanding ?? 0;
    items.push(
      missing > 0 && missing < STANDARD_CAMPER_ITEMS.length
        ? `${missing} required document${missing === 1 ? "" : "s"} still outstanding`
        : [...STANDARD_CAMPER_ITEMS].join(", ")
    );
  }

  if (!isPaidInFull(input.totalDueCents, input.amountPaidCents)) {
    const owed = balanceCents(input.totalDueCents, input.amountPaidCents);
    items.push(owed > 0 ? `Balance of ${formatCents(owed)} still due` : "Payment outstanding");
  }

  return items;
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** The whole machine in one call. */
export function evaluateRegistration(input: StatusInput): StatusResult {
  const today = input.today ?? new Date();
  const docsDone = documentsComplete(input);
  const paid = isPaidInFull(input.totalDueCents, input.amountPaidCents);
  const outstanding = outstandingChecklist(input);
  const balance = balanceCents(input.totalDueCents, input.amountPaidCents);

  const daysUntilDeadline = input.formsDueOn ? daysBetween(today, startOfDay(input.formsDueOn)) : null;

  let status: RegistrationStatus;
  if (isExtensionGranted(input)) {
    // An extension is a decision a person made; it survives the deadline.
    status = "extension_granted";
  } else if (docsDone && paid) {
    status = "complete";
  } else if (daysUntilDeadline === null || daysUntilDeadline >= 0) {
    status = "pending";
  } else {
    status = "overdue";
  }

  return {
    status,
    label: STATUS_LABELS[status],
    outstanding,
    paidInFull: paid,
    documentsComplete: docsDone,
    balanceCents: balance,
    daysUntilDeadline,
    provisionalHoldMessage: outstanding.length > 0 ? PROVISIONAL_HOLD_MESSAGE : null,
  };
}

/** Bucket a registrant into the camp's new/returning categories. */
export type Population = "camper" | "teen_volunteer" | "adult_volunteer";
export type WhoCategory =
  | "returning_family"
  | "new_family"
  | "returning_adult"
  | "new_adult"
  | "new_teen_counselor"
  | "returning_teen_counselor"
  | "waitlisted_camper"
  | "waitlisted_volunteer";

export const WHO_LABELS: Record<WhoCategory, string> = {
  returning_family: "Returning family",
  new_family: "New family",
  returning_adult: "Returning adult",
  new_adult: "New adult",
  new_teen_counselor: "New teen counselor",
  returning_teen_counselor: "Returning teen counselor",
  waitlisted_camper: "Waitlisted camper",
  waitlisted_volunteer: "Waitlisted volunteer",
};

export function whoCategory(args: {
  population: Population;
  isReturning: boolean;
  isWaitlisted: boolean;
}): WhoCategory {
  // The waitlist is the answer to "who" whenever it applies: a waitlisted
  // returning family still needs to appear on the waitlist list first.
  if (args.isWaitlisted) {
    return args.population === "camper" ? "waitlisted_camper" : "waitlisted_volunteer";
  }
  if (args.population === "camper") return args.isReturning ? "returning_family" : "new_family";
  if (args.population === "teen_volunteer") {
    return args.isReturning ? "returning_teen_counselor" : "new_teen_counselor";
  }
  return args.isReturning ? "returning_adult" : "new_adult";
}

/** Coarse paperwork label used as a sort key in the workbooks. */
export function paperworkLabel(tally?: DocumentTally | null): string {
  if (!tally || tally.requiredTotal === 0) return "No documents required";
  if (tally.requiredOutstanding === 0) return "Complete";
  if (tally.requiredApproved === 0) return "Not started";
  return `${tally.requiredApproved} of ${tally.requiredTotal} approved`;
}

export function paymentLabel(totalDueCents?: number | null, amountPaidCents?: number | null): string {
  const due = totalDueCents ?? 0;
  const paid = amountPaidCents ?? 0;
  if (due <= 0) return "Not invoiced";
  if (paid >= due) return "Paid in full";
  if (paid <= 0) return "Nothing paid";
  return "Partially paid";
}

/** Volunteers pick a full week or a half; campers are always full week. */
export type Timing = "full_week" | "first_half" | "second_half" | "unknown";

export const TIMING_LABELS: Record<Timing, string> = {
  full_week: "Full week",
  first_half: "First half",
  second_half: "Second half",
  unknown: "Not stated",
};

/**
 * Derives the timing label from the days someone signed up for, against the
 * full set of days the camp runs. The form stores a choice of half; the
 * database stores the days it expands into, so this reads it back.
 */
export function timingFromDays(servesOn: string[], campDays: string[]): Timing {
  if (servesOn.length === 0 || campDays.length === 0) return "unknown";
  const days = [...new Set(campDays)].sort();
  const mine = new Set(servesOn.map((d) => d.slice(0, 10)));
  const covered = days.filter((d) => mine.has(d));
  if (covered.length === 0) return "unknown";
  if (covered.length === days.length) return "full_week";

  const midpoint = Math.ceil(days.length / 2);
  const firstHalf = new Set(days.slice(0, midpoint));
  const inFirst = covered.filter((d) => firstHalf.has(d)).length;
  if (inFirst === covered.length) return "first_half";
  if (inFirst === 0) return "second_half";
  return "full_week";
}

/**
 * Sign-in for the volunteer mandatory meeting, and the paperwork check that
 * goes with it. The camp wants two things confirmed at the door: the person is
 * there, and every required document is in.
 *
 * Pure functions over plain rows, so the rule is testable without Supabase.
 * "In" means approved and not expired, the same bar the documents dashboard
 * holds: submitted is not approved.
 */

export type VolunteerKind = "teen_volunteer" | "adult_volunteer";

export type MeetingDocType = { id: string; name: string; applies_to: string; is_required: boolean };
export type MeetingDocRecord = {
  document_type_id: string;
  staff_application_id: string | null;
  status: string;
  expires_on: string | null;
};

export type MeetingRosterRow = {
  id: string;
  name: string;
  kind: VolunteerKind;
  role: string | null;
  signedInAt: string | null;
  docsComplete: boolean;
  outstanding: string[];
};

export const MEETING_FILTERS = ["all", "missing_docs", "not_signed_in"] as const;
export type MeetingFilter = (typeof MEETING_FILTERS)[number];

export const MEETING_FILTER_LABELS: Record<MeetingFilter, string> = {
  all: "Everyone",
  missing_docs: "Missing documents",
  not_signed_in: "Not signed in",
};

/** Application statuses that mean the person is not coming. */
const NOT_EXPECTED = new Set(["rejected", "declined", "withdrawn", "denied", "inactive"]);

export function isExpectedVolunteer(status: string | null | undefined): boolean {
  return !NOT_EXPECTED.has((status ?? "").trim().toLowerCase());
}

/**
 * Teen or adult, by age on `asOf`. No birth date reads as adult, because the
 * adult list (background check, PGC, VIRTUS) is the stricter one to miss.
 */
export function volunteerKind(birthDate: string | null | undefined, asOf: Date): VolunteerKind {
  if (!birthDate) return "adult_volunteer";
  const birth = new Date(`${birthDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return "adult_volunteer";
  let age = asOf.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    asOf.getUTCMonth() < birth.getUTCMonth() ||
    (asOf.getUTCMonth() === birth.getUTCMonth() && asOf.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age < 18 ? "teen_volunteer" : "adult_volunteer";
}

/**
 * The required documents this person still owes, in the camp's display order
 * (the caller passes types already ordered). Each entry names the document and,
 * when a record exists, why it does not count yet.
 */
export function outstandingDocuments(
  kind: VolunteerKind,
  types: MeetingDocType[],
  records: MeetingDocRecord[],
  today: string,
): string[] {
  const owed = types.filter((t) => t.is_required && t.applies_to === kind);
  const outstanding: string[] = [];
  for (const type of owed) {
    const mine = records.filter((r) => r.document_type_id === type.id);
    const good = mine.some((r) => r.status === "approved" && (!r.expires_on || r.expires_on.slice(0, 10) >= today));
    if (good) continue;
    const approvedButLapsed = mine.some((r) => r.status === "approved" || r.status === "expired");
    const latest = mine.find((r) => r.status === "submitted") ?? mine.find((r) => r.status === "rejected");
    const reason = approvedButLapsed ? "expired" : latest?.status;
    outstanding.push(reason ? `${type.name} (${reason})` : type.name);
  }
  return outstanding;
}

export function filterRoster(rows: MeetingRosterRow[], filter: MeetingFilter): MeetingRosterRow[] {
  if (filter === "missing_docs") return rows.filter((r) => !r.docsComplete);
  if (filter === "not_signed_in") return rows.filter((r) => !r.signedInAt);
  return rows;
}

export function rosterCounts(rows: MeetingRosterRow[]) {
  return {
    expected: rows.length,
    signedIn: rows.filter((r) => r.signedInAt).length,
    missingDocs: rows.filter((r) => !r.docsComplete).length,
    ready: rows.filter((r) => r.signedInAt && r.docsComplete).length,
  };
}

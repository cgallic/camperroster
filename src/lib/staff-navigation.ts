import type { Role } from "./auth";

export type StaffNavigationItem = {
  href: string;
  label: string;
  shortLabel?: string;
  /** Sub-menu this page sits under; consecutive items with the same group are shown together. */
  group?: string;
  /** One line on what the page is for, shown on hover. */
  description: string;
  roles: readonly Role[];
};

const DIRECTOR: readonly Role[] = ["director"];
const ADMIN: readonly Role[] = ["director", "registrar"];
const CHECK_IN: readonly Role[] = ["director", "registrar", "staff"];
const COUNSELOR: readonly Role[] = ["director", "counselor", "red_shirt", "staff", "nurse", "registrar"];
const CANTEEN: readonly Role[] = ["director", "staff", "counselor", "registrar"];
const NURSE: readonly Role[] = ["director", "nurse"];

/**
 * The signed-in product map. Keep this aligned with requireArea()/requireRole()
 * on the destination pages: navigation is discoverability, never authorization.
 */
export const STAFF_NAVIGATION: readonly StaffNavigationItem[] = [
  { href: "/admin", label: "Director home", shortLabel: "Home", roles: ADMIN, description: "Today's numbers and anything that needs a decision." },
  { href: "/admin/intake", label: "Current intake", shortLabel: "Intake", group: "Registration", roles: ADMIN, description: "Registrations and volunteer applications as they come in." },
  { href: "/admin/forms", label: "Registration forms", shortLabel: "Forms", group: "Registration", roles: ADMIN, description: "Build the forms families and volunteers fill out, and set when they open." },
  { href: "/admin/cabins", label: "Cabins & waitlist", shortLabel: "Cabins", group: "Registration", roles: ADMIN, description: "Cabin caps, placements, moves and the waitlist." },
  { href: "/admin/history", label: "Historical records", shortLabel: "History", group: "Registration", roles: DIRECTOR, description: "Past years' registrations imported from your spreadsheets." },
  { href: "/admin/finance", label: "Finance", roles: ADMIN, description: "Who has paid, who owes, financial aid, refunds and cash or check payments." },
  { href: "/admin/documents", label: "Documents", group: "Documentation", roles: ADMIN, description: "Review uploaded medical forms, insurance cards and waivers." },
  { href: "/admin/exports", label: "Reports & exports", shortLabel: "Reports", group: "Documentation", roles: ADMIN, description: "Filter the data into lists and download them, or start an email to that list." },
  { href: "/nurse/emar", label: "Medication log", shortLabel: "Meds", roles: NURSE, description: "For the nurse: record each dose of medication given at camp." },
  { href: "/counselor", label: "Counselor roster", shortLabel: "Roster", roles: COUNSELOR, description: "For counselors: the campers in their cabin." },
  { href: "/canteen/pos", label: "Canteen", roles: CANTEEN, description: "The camp store register: campers spend from money their parents put on account." },
  { href: "/admin/mail", label: "Family mail", shortLabel: "Mail", group: "Mail", roles: ADMIN, description: "Emails from camp to families. Each one is reviewed and approved before it sends." },
  { href: "/admin/bunk-notes", label: "Bunk notes", group: "Mail", roles: ADMIN, description: "Notes parents write to their camper during the week, printed and handed out at camp." },
  { href: "/admin/checkin", label: "Check-in", roles: CHECK_IN, description: "Use on arrival day to check campers in." },
  { href: "/admin/staff", label: "Team access", shortLabel: "Team", group: "Camp admin", roles: DIRECTOR, description: "Who can sign in and what each person can see." },
  { href: "/admin/activity", label: "Activity history", shortLabel: "Activity", group: "Camp admin", roles: DIRECTOR, description: "Who changed what, and when." },
  { href: "/admin/settings", label: "Camp settings", shortLabel: "Settings", group: "Camp admin", roles: DIRECTOR, description: "Camp details, seasons, sessions and family pricing." },
  { href: "/admin/camps/new", label: "Set up a customer camp", shortLabel: "New camp", group: "Camp admin", roles: DIRECTOR, description: "Create a camp for a new customer and invite their director." },
  { href: "/billing", label: "Billing", group: "Camp admin", roles: DIRECTOR, description: "Your camp's Camper Roster subscription." },
] as const;

/** Routes that render inside the signed-in staff app rather than the public site. */
export const STAFF_PREFIXES = ["/admin", "/nurse", "/counselor", "/canteen", "/billing", "/staff", "/demo-preview"] as const;

export function navigationForRole(role: Role): StaffNavigationItem[] {
  return STAFF_NAVIGATION.filter((item) => item.roles.includes(role));
}

/** Where a role lands after signing in: the first page its navigation offers. */
export function homeForRole(role: Role): string {
  return navigationForRole(role)[0]?.href ?? "/no-access";
}

import type { Role } from "./auth";

export type StaffNavigationItem = {
  href: string;
  label: string;
  shortLabel?: string;
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
  { href: "/admin", label: "Director home", shortLabel: "Home", roles: ADMIN },
  { href: "/admin/intake", label: "Current intake", shortLabel: "Intake", roles: ADMIN },
  { href: "/admin/forms", label: "Registration forms", shortLabel: "Forms", roles: ADMIN },
  { href: "/admin/checkin", label: "Check-in", roles: CHECK_IN },
  { href: "/admin/cabins", label: "Cabins & waitlist", shortLabel: "Cabins", roles: ADMIN },
  { href: "/admin/documents", label: "Documents", roles: ADMIN },
  { href: "/admin/bunk-notes", label: "Bunk notes", roles: ADMIN },
  { href: "/nurse/emar", label: "Medication log", shortLabel: "eMAR", roles: NURSE },
  { href: "/counselor", label: "Counselor roster", shortLabel: "Roster", roles: COUNSELOR },
  { href: "/canteen/pos", label: "Canteen", roles: CANTEEN },
  { href: "/admin/mail", label: "Family mail", shortLabel: "Mail", roles: ADMIN },
  { href: "/admin/finance", label: "Finance", roles: ADMIN },
  { href: "/admin/exports", label: "Reports & exports", shortLabel: "Reports", roles: ADMIN },
  { href: "/admin/history", label: "Historical records", shortLabel: "History", roles: DIRECTOR },
  { href: "/admin/staff", label: "Team access", shortLabel: "Team", roles: DIRECTOR },
  { href: "/billing", label: "Billing", roles: DIRECTOR },
] as const;

export function navigationForRole(role: Role): StaffNavigationItem[] {
  return STAFF_NAVIGATION.filter((item) => item.roles.includes(role));
}

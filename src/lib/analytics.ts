import { STAFF_PREFIXES } from "./staff-navigation.ts";

/**
 * Pages that hold camper, family, health or staff data never report to Google.
 * Analytics is for the public site and the signup funnel only.
 */
const PRIVATE_PREFIXES = [...STAFF_PREFIXES, "/portal", "/register", "/c", "/volunteer", "/auth", "/reset-password", "/no-access", "/setup-incomplete"];

export function isTrackedPath(pathname: string) {
  return !PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

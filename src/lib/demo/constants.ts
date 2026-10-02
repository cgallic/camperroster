/**
 * The shared, read-only demo login. It is a director of exactly one camp
 * (DEMO_CAMP_SLUG) whose rows are all made up, middleware refuses every write
 * it attempts (so nothing it clicks can send mail, charge a card or touch real
 * data), and /api/demo/reset puts the camp back every night. Its password is
 * not kept in this repository.
 */
export const DEMO_EMAIL = "demo@camperroster.com";
export const DEMO_USER_ID = "00000000-0000-4000-8000-009900000001";
export const DEMO_CAMP_SLUG = "demo";
export const DEMO_CAMP_NAME = "Camp Willow Creek (Demo)";

export function isDemoEmail(email: string | null | undefined): boolean {
  return (email ?? "").toLowerCase() === DEMO_EMAIL;
}

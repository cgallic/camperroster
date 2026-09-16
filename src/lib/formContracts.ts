/**
 * Shared wire contracts between the public forms and their API routes.
 *
 * These types exist because the register form and /api/register previously used
 * two different sets of field names, so every submitted value fell through to a
 * hardcoded default. Both ends now import from here — if one side is renamed,
 * the other fails to compile.
 */

export type PaymentPlan = "installment" | "deposit_only" | "pay_in_full";
export type SessionSlug = "session-1" | "session-2" | "session-3";

/** POST /api/register */
export interface RegisterPayload {
  // Step 1 — guardian / household
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  parentStreet: string;
  parentCity: string;
  parentState: string;
  parentZip: string;
  relationship: string;

  // Step 2 — camper + session
  sessionSlug: SessionSlug | string;
  camperFirstName: string;
  camperLastName: string;
  camperDob: string;
  camperGender: string;
  camperGrade: string;
  cabinBuddy: string;

  // Step 3 — health
  peanutAllergy: boolean;
  epipen: boolean;
  inhaler: boolean;
  dietaryRestrictions: string;
  medicalConditions: string;
  primaryPhysician: string;
  physicianPhone: string;

  // Step 4 — insurance
  insuranceCarrier: string;
  policyNumber: string;
  groupNumber: string;

  // Step 5 — plan + consent
  paymentPlan: PaymentPlan | string;
  emergencyAuth: boolean;
  waterfrontConsent: boolean;
  signature: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
  registrationId?: string;
  camperId?: string;
}

/** POST /api/volunteer */
export interface VolunteerPayload {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  role: string;
  refName: string;
  refPhone: string;
  refEmail: string;
  refRelationship: string;
}

export interface VolunteerResponse {
  success: boolean;
  message?: string;
  error?: string;
  applicationId?: string;
  referenceId?: string;
}

/** POST /api/camps — inbound camp-director signup from /start */
export interface CampSignupPayload {
  campName: string;
  directorName: string;
  directorEmail: string;
  slug: string;
}

export interface CampSignupResponse {
  success: boolean;
  message?: string;
  error?: string;
  campId?: string;
  slug?: string;
}

/** Normalise a free-typed slug to lowercase alphanumerics and single hyphens. */
export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Conservative email check — rejects the obviously-broken, not the exotic. */
export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(raw.trim());
}

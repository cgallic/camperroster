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
  /**
   * Which camp this registration belongs to — the slug from /c/<slug>.
   * REQUIRED. There is no default tenant: a registration that cannot be
   * attached to a camp is rejected, never filed under someone else's camp.
   */
  campSlug: string;

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
  /** Which camp is being applied to — the slug from /c/<slug>. REQUIRED. */
  campSlug: string;
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

/**
 * POST /api/camps — camp-director signup.
 *
 * This is no longer a "record a request" form. One call creates the auth user,
 * the camp, and the owning camp_members row with role 'director', and signs the
 * director in. Either all three exist afterwards or none of them do.
 */
export interface CampSignupPayload {
  campName: string;
  directorName: string;
  directorEmail: string;
  slug: string;
  password: string;
}

export interface CampSignupResponse {
  success: boolean;
  message?: string;
  error?: string;
  campId?: string;
  slug?: string;
  /** True when the response also set session cookies — the caller can go straight to /admin. */
  signedIn?: boolean;
}

/** Minimum password length accepted at signup. Supabase's own default floor is 6. */
export const MIN_PASSWORD_LENGTH = 10;

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

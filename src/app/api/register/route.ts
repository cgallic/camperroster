import { NextResponse } from "next/server";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabase";
import { lookupCampBySlug } from "@/lib/campLookup";
import { isSetupIncompleteError, setupIncompleteResponse } from "@/lib/auth";
import { notifyInbound } from "@/lib/notify";
import type { RegisterPayload } from "@/lib/formContracts";
import { isValidEmail, normalizeSlug } from "@/lib/formContracts";
import { issueIntakeToken } from "@/lib/signed-payload";

/**
 * Public, unauthenticated write: a parent registering a camper.
 *
 * SERVICE ROLE is used deliberately - the parent has no account, so RLS has no
 * identity to authorise the insert with, and migration 0001 grants the `anon`
 * role nothing on campers/guardians/health_profiles/insurance_policies (they
 * hold children's medical data). The tenant is resolved from the campSlug in
 * the payload and set explicitly on every row. There is NO default tenant and
 * no fallback organisation id.
 */

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  let body: Partial<RegisterPayload>;
  try {
    body = (await req.json()) as Partial<RegisterPayload>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  // ---- Read exactly the names the form sends -------------------------------
  const campSlug = normalizeSlug(str(body.campSlug));
  const parentFirstName = str(body.parentFirstName);
  const parentLastName = str(body.parentLastName);
  const parentEmail = str(body.parentEmail);
  const parentPhone = str(body.parentPhone);
  const parentStreet = str(body.parentStreet);
  const parentCity = str(body.parentCity);
  const parentState = str(body.parentState);
  const parentZip = str(body.parentZip);
  const relationship = str(body.relationship) || "Parent / Guardian";

  const sessionId = str(body.sessionId) || str(body.sessionSlug);
  const camperFirstName = str(body.camperFirstName);
  const camperLastName = str(body.camperLastName);
  const camperDob = str(body.camperDob);
  const camperGender = str(body.camperGender);
  const camperGrade = str(body.camperGrade);
  const cabinBuddy = str(body.cabinBuddy);

  const peanutAllergy = Boolean(body.peanutAllergy);
  const epipen = Boolean(body.epipen);
  const inhaler = Boolean(body.inhaler);
  const dietaryRestrictions = str(body.dietaryRestrictions);
  const medicalConditions = str(body.medicalConditions);
  const primaryPhysician = str(body.primaryPhysician);
  const physicianPhone = str(body.physicianPhone);

  const insuranceCarrier = str(body.insuranceCarrier);
  const policyNumber = str(body.policyNumber);
  const groupNumber = str(body.groupNumber);

  const paymentPlan = str(body.paymentPlan);
  const emergencyAuth = Boolean(body.emergencyAuth);
  const waterfrontConsent = Boolean(body.waterfrontConsent);
  const signature = str(body.signature);

  // ---- Validate. Never invent a person to satisfy a NOT NULL column. -------
  const missing: string[] = [];
  const requireField = (value: string, label: string) => {
    if (!value) missing.push(label);
  };
  requireField(parentFirstName, "parent first name");
  requireField(parentLastName, "parent last name");
  requireField(parentEmail, "parent email");
  requireField(parentPhone, "parent phone");
  requireField(parentStreet, "street address");
  requireField(parentCity, "city");
  requireField(parentState, "state");
  requireField(parentZip, "ZIP code");
  requireField(camperFirstName, "camper first name");
  requireField(camperLastName, "camper last name");
  requireField(camperDob, "camper date of birth");
  requireField(camperGender, "camper gender");
  requireField(camperGrade, "grade entering");
  requireField(signature, "typed legal signature");

  if (missing.length) {
    return NextResponse.json(
      { success: false, error: `Missing required ${missing.length === 1 ? "field" : "fields"}: ${missing.join(", ")}.` },
      { status: 400 }
    );
  }

  if (!isValidEmail(parentEmail)) {
    return NextResponse.json(
      { success: false, error: "That parent email address does not look valid." },
      { status: 400 }
    );
  }

  if (Number.isNaN(Date.parse(camperDob))) {
    return NextResponse.json(
      { success: false, error: "Camper date of birth is not a valid date." },
      { status: 400 }
    );
  }

  if (!emergencyAuth || !waterfrontConsent) {
    return NextResponse.json(
      { success: false, error: "Both the emergency medical and waterfront authorizations must be agreed to." },
      { status: 400 }
    );
  }

  const idempotencyKey = str(req.headers.get("idempotency-key"));
  if (idempotencyKey.length < 8 || idempotencyKey.length > 200) {
    return NextResponse.json(
      { success: false, error: "A valid Idempotency-Key header is required. Nothing was saved." },
      { status: 400 }
    );
  }
  if (!UUID_RE.test(sessionId)) {
    return NextResponse.json(
      { success: false, error: "Choose a session from this camp before submitting. Nothing was saved." },
      { status: 400 }
    );
  }

  const gradeEntering = parseInt(camperGrade, 10);
  if (Number.isNaN(gradeEntering)) {
    return NextResponse.json(
      { success: false, error: "Grade entering must be a number." },
      { status: 400 }
    );
  }

  // ---- Resolve the tenant -------------------------------------------------
  // This used to be CAMP_ORGANIZATION_ID with a hardcoded UUID fallback, so
  // every camp on the platform wrote into one tenant. The camp now comes from
  // the registration link the family followed, and a registration that cannot
  // be attached to a real camp is REFUSED rather than filed under a default.
  if (!campSlug) {
    return NextResponse.json(
      {
        success: false,
        error:
          "This registration link is not attached to a camp. Open your camp's own link (camperroster.com/c/your-camp) and register from there. Nothing was saved.",
      },
      { status: 400 }
    );
  }

  if (!hasServiceRoleKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Registrations are not configured on this deployment (SUPABASE_SERVICE_ROLE_KEY is unset). Nothing was saved.",
      },
      { status: 503 }
    );
  }

  const lookup = await lookupCampBySlug(campSlug);
  if (lookup.status === "setup_incomplete") {
    return setupIncompleteResponse(new Error(lookup.message));
  }
  if (lookup.status === "error") {
    return NextResponse.json(
      { success: false, error: "Could not look up that camp. Nothing was saved." },
      { status: 500 }
    );
  }
  if (lookup.status === "not_found") {
    return NextResponse.json(
      { success: false, error: 'No camp is registered at "' + campSlug + '". Nothing was saved.' },
      { status: 404 }
    );
  }

  const campId = lookup.camp.id;

  try {
    const { data: result, error: intakeError } = await (supabaseAdmin as any).rpc(
      "create_registration_intake",
      {
        p_camp_id: campId,
        p_session_id: sessionId,
        p_idempotency_key: idempotencyKey,
        p_payload: {
          parent_first_name: parentFirstName,
          parent_last_name: parentLastName,
          parent_email: parentEmail,
          parent_phone: parentPhone,
          parent_street: parentStreet,
          parent_city: parentCity,
          parent_state: parentState,
          parent_zip: parentZip,
          relationship,
          camper_first_name: camperFirstName,
          camper_last_name: camperLastName,
          camper_dob: camperDob,
          camper_gender: camperGender,
          camper_grade: String(gradeEntering),
          cabin_buddy: cabinBuddy,
          peanut_allergy: peanutAllergy,
          epipen,
          inhaler,
          dietary_restrictions: dietaryRestrictions,
          medical_conditions: medicalConditions,
          physician_name: primaryPhysician,
          physician_phone: physicianPhone,
          insurance_carrier: insuranceCarrier,
          policy_number: policyNumber,
          group_number: groupNumber,
          payment_plan: paymentPlan,
          signature,
        },
      }
    );
    if (intakeError) throw intakeError;
    const registrationId = String(result.registration_id);
    const camperId = String(result.camper_id);
    const invoiceId = String(result.invoice_id);
    const uploadToken = issueIntakeToken({ campId, registrationId, camperId, invoiceId });

    await notifyInbound({
      kind: "registration",
      summary: `New camper registration: ${camperFirstName} ${camperLastName} (guardian ${parentFirstName} ${parentLastName}, ${parentEmail})`,
      details: {
        registration_id: registrationId,
        camp_id: campId,
        camp_slug: lookup.camp.slug,
        camper_id: camperId,
        session_id: sessionId,
        guardian_email: parentEmail,
        guardian_phone: parentPhone,
        payment_plan: String(result.payment_plan),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Camper registration saved.",
      registrationId,
      camperId,
      invoiceId,
      uploadToken,
      parentAccountStatus: "not_created",
    });
  } catch (err: any) {
    // The tenancy migration has not been applied: camp_id does not exist yet.
    if (isSetupIncompleteError(err)) {
      console.error("Registration Error (migrations not applied):", err);
      return setupIncompleteResponse(err);
    }
    // 23502 = not_null_violation. The likeliest cause is a column this route
    // deliberately no longer writes (organization_id, session_id) still being
    // NOT NULL because migration 0001 has not been applied.
    if (err?.code === "23502") {
      console.error("Registration Error (NOT NULL on a retired column):", err);
      return setupIncompleteResponse(err);
    }
    if (err?.code === "22023" || err?.code === "23503") {
      return NextResponse.json(
        { success: false, error: err.message || "That camp session is unavailable. Nothing was saved." },
        { status: 400 }
      );
    }
    if (err?.code === "40001") {
      return NextResponse.json(
        { success: false, error: "That submission is already being processed. Retry with the same Idempotency-Key." },
        { status: 409 }
      );
    }
    console.error("Registration Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Could not save this registration." },
      { status: 500 }
    );
  }
}

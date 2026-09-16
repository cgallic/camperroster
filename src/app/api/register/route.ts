import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { notifyInbound } from "@/lib/notify";
import type { RegisterPayload } from "@/lib/formContracts";
import { isValidEmail } from "@/lib/formContracts";

/**
 * Tuition per session, in cents. Mirrors the prices printed on the session
 * cards in src/app/register/page.tsx. Keep the two in sync.
 */
const SESSION_TUITION_CENTS: Record<string, number> = {
  "session-1": 65000,
  "session-2": 65000,
  "session-3": 67500,
};

/** Form value -> the value stored in registrations.payment_plan. */
const PAYMENT_PLAN_MAP: Record<string, string> = {
  installment: "installment_3mo",
  deposit_only: "deposit_only",
  pay_in_full: "pay_in_full",
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Resolve the camp_sessions UUID for the session the parent picked.
 * The form sends a slug ("session-2"); the DB column is a UUID FK, so the
 * mapping has to come from configuration. Set CAMP_SESSION_ID_SESSION_2 etc.
 * to route each slug to its own session row; CAMP_SESSION_ID is the fallback.
 */
function resolveSessionId(slug: string): string | undefined {
  const key = "CAMP_SESSION_ID_" + slug.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  return process.env[key] || process.env.CAMP_SESSION_ID;
}

export async function POST(req: Request) {
  let body: Partial<RegisterPayload>;
  try {
    body = (await req.json()) as Partial<RegisterPayload>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  // ---- Read exactly the names the form sends -------------------------------
  const parentFirstName = str(body.parentFirstName);
  const parentLastName = str(body.parentLastName);
  const parentEmail = str(body.parentEmail);
  const parentPhone = str(body.parentPhone);
  const parentStreet = str(body.parentStreet);
  const parentCity = str(body.parentCity);
  const parentState = str(body.parentState);
  const parentZip = str(body.parentZip);
  const relationship = str(body.relationship) || "Parent / Guardian";

  const sessionSlug = str(body.sessionSlug) || "session-1";
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

  const gradeEntering = parseInt(camperGrade, 10);
  if (Number.isNaN(gradeEntering)) {
    return NextResponse.json(
      { success: false, error: "Grade entering must be a number." },
      { status: 400 }
    );
  }

  // Tenant/session routing is configuration, not user data. These two literals
  // are the pre-existing seeded Camp Hope org + session and are kept as the
  // fallback so the live form keeps working when the env vars are unset.
  const orgId = process.env.CAMP_ORGANIZATION_ID || "11111111-1111-1111-1111-111111111111";
  const sessionId = resolveSessionId(sessionSlug) || "22222222-2222-2222-2222-222222222222";

  try {
    // ---- guardians --------------------------------------------------------
    const { data: guardian, error: guardianErr } = await supabaseAdmin
      .from("guardians")
      .insert({
        organization_id: orgId,
        first_name: parentFirstName,
        last_name: parentLastName,
        email: parentEmail,
        phone: parentPhone,
        relationship,
        address_line1: parentStreet,
        city: parentCity,
        state: parentState,
        zip: parentZip,
      })
      .select("id")
      .single();

    if (guardianErr) throw guardianErr;

    // ---- campers ----------------------------------------------------------
    const { data: camper, error: camperErr } = await supabaseAdmin
      .from("campers")
      .insert({
        guardian_id: guardian.id,
        legal_first_name: camperFirstName,
        legal_last_name: camperLastName,
        birth_date: camperDob,
        gender: camperGender,
        grade_entering: gradeEntering,
      })
      .select("id")
      .single();

    if (camperErr) throw camperErr;

    // ---- health_profiles --------------------------------------------------
    // NOTE: immunization_status starts unverified. The nurse flow in
    // src/app/admin/page.tsx is what sets it to "approved" after a human
    // reviews the record — this route must never pre-approve it.
    const { error: healthErr } = await supabaseAdmin
      .from("health_profiles")
      .insert({
        camper_id: camper.id,
        has_allergies: peanutAllergy,
        allergy_details: peanutAllergy ? "Peanut / nut allergy reported by guardian at registration." : null,
        has_epipen: epipen,
        epipen_location: epipen ? "Reported at registration — confirm storage location at check-in." : null,
        dietary_restrictions: dietaryRestrictions || null,
        medical_conditions: medicalConditions || null,
        physician_name: primaryPhysician || null,
        physician_phone: physicianPhone || null,
        immunization_status: "pending_review",
        special_care_notes: inhaler ? "Camper carries an inhaler." : null,
      });

    if (healthErr) throw healthErr;

    // ---- insurance_policies (optional) ------------------------------------
    // TODO: schema/feature — card_front_url / card_back_url are intentionally
    // not written. The wizard's file inputs only capture a local filename;
    // there is no upload to Supabase Storage yet, and a filename is not a URL.
    if (insuranceCarrier && policyNumber) {
      const { error: insuranceErr } = await supabaseAdmin.from("insurance_policies").insert({
        camper_id: camper.id,
        insurance_company: insuranceCarrier,
        policyholder_name: `${parentFirstName} ${parentLastName}`,
        relationship_to_camper: relationship,
        member_id: policyNumber,
        group_number: groupNumber || null,
        status: "pending_review",
      });

      if (insuranceErr) throw insuranceErr;
    }

    // ---- registrations ----------------------------------------------------
    const { data: registration, error: regErr } = await supabaseAdmin
      .from("registrations")
      .insert({
        organization_id: orgId,
        session_id: sessionId,
        camper_id: camper.id,
        guardian_id: guardian.id,
        status: "submitted",
        step_completed: 5,
        progress_percentage: 100,
        consents_agreed: {
          emergency_medical: emergencyAuth,
          waterfront_swimming: waterfrontConsent,
        },
        signed_by: signature,
        signed_at: new Date().toISOString(),
        buddy_requests: cabinBuddy ? [cabinBuddy] : [],
        payment_plan: PAYMENT_PLAN_MAP[paymentPlan] || "installment_3mo",
        total_tuition_cents: SESSION_TUITION_CENTS[sessionSlug] ?? 65000,
        // No payment has been taken by this route. Stripe checkout owns this
        // number — do not report money we have not collected.
        amount_paid_cents: 0,
      })
      .select("id")
      .single();

    if (regErr) throw regErr;

    await notifyInbound({
      kind: "registration",
      summary: `New camper registration: ${camperFirstName} ${camperLastName} (guardian ${parentFirstName} ${parentLastName}, ${parentEmail})`,
      details: {
        registration_id: registration.id,
        camper_id: camper.id,
        session: sessionSlug,
        guardian_email: parentEmail,
        guardian_phone: parentPhone,
        payment_plan: PAYMENT_PLAN_MAP[paymentPlan] || "installment_3mo",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Camper registration saved.",
      registrationId: registration.id,
      camperId: camper.id,
    });
  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Could not save this registration." },
      { status: 500 }
    );
  }
}

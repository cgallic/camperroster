import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      camperFirstName,
      camperLastName,
      dob,
      camperDob,
      gender,
      grade,
      parentStreet,
      parentCity,
      parentState,
      parentZip,
      guardianName,
      guardianPhone,
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhone,
      hasAllergies,
      allergyDetails,
      hasEpipen,
      insuranceCarrier,
      memberId,
      groupNumber,
      buddyName,
      cabinBuddy,
      waiverMedical,
      waiverWater,
      emergencyAuth,
      waterfrontConsent,
      paymentPlan,
      payment_plan,
      signature,
    } = body;

    const submittedGuardianName = guardianName || [parentFirstName, parentLastName].filter(Boolean).join(" ");
    const submittedCamperFirstName = firstName || camperFirstName;
    const submittedCamperLastName = lastName || camperLastName;
    const submittedDob = dob || camperDob;
    const submittedGuardianPhone = guardianPhone || parentPhone;
    const submittedBuddyName = buddyName || cabinBuddy;
    const submittedPaymentPlan = paymentPlan || payment_plan;
    const medicalConsent = waiverMedical ?? emergencyAuth;
    const waterConsent = waiverWater ?? waterfrontConsent;

    if (
      !submittedGuardianName ||
      !parentEmail ||
      !submittedGuardianPhone ||
      !parentStreet ||
      !parentCity ||
      !parentState ||
      !parentZip ||
      !submittedCamperFirstName ||
      !submittedCamperLastName ||
      !submittedDob ||
      !signature
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required registration fields." },
        { status: 400 }
      );
    }

    const orgId = process.env.CAMP_ORGANIZATION_ID || "11111111-1111-1111-1111-111111111111";
    const sessionId = process.env.CAMP_SESSION_ID || "22222222-2222-2222-2222-222222222222";

    const { data: guardian, error: guardianErr } = await supabaseAdmin
      .from("guardians")
      .insert({
        organization_id: orgId,
        first_name: submittedGuardianName.split(" ")[0],
        last_name: submittedGuardianName.split(" ").slice(1).join(" ") || "Guardian",
        email: parentEmail,
        phone: submittedGuardianPhone,
        relationship: "Parent / Guardian",
        address_line1: parentStreet,
        city: parentCity,
        state: parentState,
        zip: parentZip,
      })
      .select("id")
      .single();

    if (guardianErr) throw guardianErr;

    const { data: camper, error: camperErr } = await supabaseAdmin
      .from("campers")
      .insert({
        guardian_id: guardian.id,
        legal_first_name: submittedCamperFirstName,
        legal_last_name: submittedCamperLastName,
        birth_date: submittedDob,
        gender: gender || "male",
        grade_entering: parseInt(grade) || 4,
      })
      .select("id")
      .single();

    if (camperErr) throw camperErr;

    const { error: healthErr } = await supabaseAdmin
      .from("health_profiles")
      .insert({
        camper_id: camper.id,
        has_allergies: Boolean(hasAllergies),
        allergy_details: allergyDetails || null,
        has_epipen: Boolean(hasEpipen),
        immunization_status: "approved",
        special_care_notes: hasEpipen ? "Carries EpiPen in backpack + backup at health lodge" : null,
      });

    if (healthErr) throw healthErr;

    if (insuranceCarrier) {
      await supabaseAdmin.from("insurance_policies").insert({
        camper_id: camper.id,
        insurance_company: insuranceCarrier,
        policyholder_name: submittedGuardianName,
        relationship_to_camper: "Guardian",
        member_id: memberId || null,
        group_number: groupNumber || null,
        card_front_url: null,
        card_back_url: null,
        status: "pending_review",
      });
    }

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
          emergency_medical: Boolean(medicalConsent),
          waterfront_swimming: Boolean(waterConsent),
        },
        signed_by: signature,
        signed_at: new Date().toISOString(),
        buddy_requests: submittedBuddyName ? [submittedBuddyName] : [],
        payment_plan: submittedPaymentPlan || "installment_3mo",
        total_tuition_cents: 65000,
        amount_paid_cents: 0,
      })
      .select("id")
      .single();

    if (regErr) throw regErr;

    return NextResponse.json({
      success: true,
      message: "Camper registration saved to live database.",
      registrationId: registration.id,
      camperId: camper.id,
    });
  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

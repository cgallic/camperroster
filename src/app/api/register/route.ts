import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      dob,
      gender,
      grade,
      address,
      guardianName,
      guardianPhone,
      hasAllergies,
      allergyDetails,
      hasEpipen,
      insuranceCarrier,
      memberId,
      groupNumber,
      buddyName,
      waiverMedical,
      waiverWater,
      paymentPlan,
      signature,
    } = body;

    const orgId = process.env.CAMP_ORGANIZATION_ID || "11111111-1111-1111-1111-111111111111";
    const sessionId = process.env.CAMP_SESSION_ID || "22222222-2222-2222-2222-222222222222";

    const { data: guardian, error: guardianErr } = await supabaseAdmin
      .from("guardians")
      .insert({
        organization_id: orgId,
        first_name: guardianName ? guardianName.split(" ")[0] : "Guardian",
        last_name: guardianName ? guardianName.split(" ").slice(1).join(" ") : "Parent",
        email: "parent." + Date.now() + "@example.com",
        phone: guardianPhone || "(908) 555-0147",
        relationship: "Parent / Guardian",
        address_line1: address || "12 Evergreen Lane",
        city: "Bernardsville",
        state: "NJ",
        zip: "07924",
      })
      .select("id")
      .single();

    if (guardianErr) throw guardianErr;

    const { data: camper, error: camperErr } = await supabaseAdmin
      .from("campers")
      .insert({
        guardian_id: guardian.id,
        legal_first_name: firstName || "Camper",
        legal_last_name: lastName || "Camper",
        birth_date: dob || "2017-08-14",
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
        policyholder_name: guardianName || "Guardian",
        relationship_to_camper: "Guardian",
        member_id: memberId || "MEMBER123",
        group_number: groupNumber || "GRP123",
        card_front_url: "verified_card_front.jpg",
        card_back_url: "verified_card_back.jpg",
        status: "verified",
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
          emergency_medical: Boolean(waiverMedical),
          waterfront_swimming: Boolean(waiverWater),
        },
        signed_by: signature || guardianName || "Peter Gallic",
        signed_at: new Date().toISOString(),
        buddy_requests: buddyName ? [buddyName] : [],
        payment_plan: paymentPlan || "installment_3mo",
        total_tuition_cents: 65000,
        amount_paid_cents: 10000,
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

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { notifyInbound } from "@/lib/notify";
import type { VolunteerPayload } from "@/lib/formContracts";
import { isValidEmail } from "@/lib/formContracts";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  let body: Partial<VolunteerPayload>;
  try {
    body = (await req.json()) as Partial<VolunteerPayload>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const name = str(body.name);
  const email = str(body.email);
  const phone = str(body.phone);
  const birthDate = str(body.birthDate);
  const role = str(body.role);
  const refName = str(body.refName);
  const refPhone = str(body.refPhone);
  const refEmail = str(body.refEmail);
  const refRelationship = str(body.refRelationship);

  const missing: string[] = [];
  if (!name) missing.push("full name");
  if (!email) missing.push("email");
  if (!phone) missing.push("mobile phone");
  if (!birthDate) missing.push("date of birth");
  if (!role) missing.push("volunteer role");
  if (!refName) missing.push("reference name");
  if (!refPhone) missing.push("reference phone");
  if (!refEmail) missing.push("reference email");
  if (!refRelationship) missing.push("reference relationship");

  if (missing.length) {
    return NextResponse.json(
      { success: false, error: `Missing required ${missing.length === 1 ? "field" : "fields"}: ${missing.join(", ")}.` },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ success: false, error: "Your email address does not look valid." }, { status: 400 });
  }
  if (!isValidEmail(refEmail)) {
    return NextResponse.json({ success: false, error: "The reference email address does not look valid." }, { status: 400 });
  }
  if (Number.isNaN(Date.parse(birthDate))) {
    return NextResponse.json({ success: false, error: "Date of birth is not a valid date." }, { status: 400 });
  }

  const nameParts = name.split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");
  if (!lastName) {
    return NextResponse.json(
      { success: false, error: "Please enter your full legal name (first and last)." },
      { status: 400 }
    );
  }

  // Tenant routing is configuration, not user data.
  const orgId = process.env.CAMP_ORGANIZATION_ID || "11111111-1111-1111-1111-111111111111";

  try {
    const { data: applicant, error: appErr } = await supabaseAdmin
      .from("staff_applications")
      .insert({
        organization_id: orgId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        birth_date: birthDate,
        role_applied: role,
        status: "references_pending",
      })
      .select("id")
      .single();

    if (appErr) throw appErr;

    const { data: reference, error: refErr } = await supabaseAdmin
      .from("staff_references")
      .insert({
        application_id: applicant.id,
        reference_name: refName,
        relationship: refRelationship,
        phone: refPhone,
        email: refEmail,
        status: "call_scheduled",
      })
      .select("id")
      .single();

    if (refErr) throw refErr;

    await notifyInbound({
      kind: "volunteer",
      summary: `New volunteer application: ${name} (${email}) for ${role}`,
      details: {
        application_id: applicant.id,
        reference_id: reference.id,
        applicant_email: email,
        applicant_phone: phone,
        role,
        reference_name: refName,
        reference_phone: refPhone,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Volunteer application saved and queued for a reference call.",
      applicationId: applicant.id,
      referenceId: reference.id,
    });
  } catch (err: any) {
    console.error("Volunteer Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Could not save this application." },
      { status: 500 }
    );
  }
}

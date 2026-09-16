import { NextResponse } from "next/server";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabase";
import { lookupCampBySlug } from "@/lib/campLookup";
import { isSetupIncompleteError, setupIncompleteResponse } from "@/lib/auth";
import { notifyInbound } from "@/lib/notify";
import type { VolunteerPayload } from "@/lib/formContracts";
import { isValidEmail, normalizeSlug } from "@/lib/formContracts";

/**
 * Public, unauthenticated write: a volunteer applying to a camp.
 *
 * SERVICE ROLE is used deliberately - the applicant has no account. The tenant
 * comes from the campSlug in the payload and is set explicitly on the
 * staff_applications and staff_references rows. There is NO default tenant.
 */

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

  const campSlug = normalizeSlug(str(body.campSlug));
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

  // ---- Resolve the tenant -------------------------------------------------
  // Was CAMP_ORGANIZATION_ID with a hardcoded UUID fallback, so every camp's
  // volunteers landed in one tenant. An application that cannot be attached to
  // a real camp is refused.
  if (!campSlug) {
    return NextResponse.json(
      {
        success: false,
        error:
          "This volunteer link is not attached to a camp. Open your camp's own link (camperroster.com/c/your-camp) and apply from there. Nothing was saved.",
      },
      { status: 400 }
    );
  }

  if (!hasServiceRoleKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Volunteer applications are not configured on this deployment (SUPABASE_SERVICE_ROLE_KEY is unset). Nothing was saved.",
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
    const { data: applicant, error: appErr } = await supabaseAdmin
      .from("staff_applications")
      .insert({
        camp_id: campId,
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
        camp_id: campId,
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
        camp_id: campId,
        camp_slug: lookup.camp.slug,
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
    if (isSetupIncompleteError(err) || err?.code === "23502") {
      console.error("Volunteer Error (migrations not applied):", err);
      return setupIncompleteResponse(err);
    }
    console.error("Volunteer Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Could not save this application." },
      { status: 500 }
    );
  }
}

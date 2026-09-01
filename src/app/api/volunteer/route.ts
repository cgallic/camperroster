import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role, refName, refPhone, name, email, phone } = body;

    const orgId = process.env.CAMP_ORGANIZATION_ID || "11111111-1111-1111-1111-111111111111";

    const { data: applicant, error: appErr } = await supabaseAdmin
      .from("staff_applications")
      .insert({
        organization_id: orgId,
        first_name: (name || "Volunteer").split(" ")[0],
        last_name: (name || "Applicant").split(" ").slice(1).join(" ") || "Volunteer",
        email: email || ("volunteer." + Date.now() + "@example.com"),
        phone: phone || "(201) 555-0144",
        birth_date: "2004-05-12",
        role_applied: role || "Cabin Counselor",
        status: "references_pending",
      })
      .select("id")
      .single();

    if (appErr) throw appErr;

    const { data: reference, error: refErr } = await supabaseAdmin
      .from("staff_references")
      .insert({
        application_id: applicant.id,
        reference_name: refName || "Pastor David Keller",
        relationship: "Pastor / Mentor",
        phone: refPhone || "(908) 555-0199",
        email: "reference@church.org",
        status: "call_scheduled",
      })
      .select("id")
      .single();

    if (refErr) throw refErr;

    return NextResponse.json({
      success: true,
      message: "Volunteer application created and queued for KaiCalls reference call.",
      applicationId: applicant.id,
      referenceId: reference.id,
    });
  } catch (err: any) {
    console.error("Volunteer Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone_number = body.phone_number || body.phone || body.reference_phone || body.target_phone;
    const director_name = body.director_name || body.applicant_name || "Camp Director";
    const camp_name = body.camp_name || body.role || "Camp Hope";

    if (!phone_number) {
      return NextResponse.json({ success: false, error: "Missing phone_number" }, { status: 400 });
    }

    const simulatedCallId = `call_${Date.now()}`;

    return NextResponse.json({
      success: true,
      call_id: simulatedCallId,
      message: `KaiCalls AI Voice Assistant is dialing ${phone_number} for ${director_name} (${camp_name}).`,
      protocol: "2-Minute Structured Pastoral & Mentorship Reference Interview",
      status: "ringing"
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

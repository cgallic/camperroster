import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone_number, director_name, camp_name } = await req.json();

    if (!phone_number) {
      return NextResponse.json({ success: false, error: "Missing phone_number" }, { status: 400 });
    }

    const simulatedCallId = `call_${Date.now()}`;

    return NextResponse.json({
      success: true,
      call_id: simulatedCallId,
      message: `KaiCalls AI Voice Assistant is dialing ${phone_number} for ${director_name || "Camp Director"} (${camp_name || "Camp Hope"}).`,
      protocol: "2-Minute Structured Pastoral & Mentorship Reference Interview",
      status: "ringing"
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

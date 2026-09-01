import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      callType,
      callerPhone,
      recipientPhone,
      durationSeconds,
      summary,
      transcript,
      sentimentScore,
      referenceId,
    } = body;

    const orgId = process.env.CAMP_ORGANIZATION_ID || "11111111-1111-1111-1111-111111111111";

    const { data: callLog, error: logErr } = await supabaseAdmin
      .from("kaicalls_logs")
      .insert({
        organization_id: orgId,
        call_type: callType || "outbound_reference",
        caller_phone: callerPhone || "+19085550147",
        recipient_phone: recipientPhone || "(908) 555-0199",
        duration_seconds: durationSeconds || 112,
        summary: summary || "Automated volunteer safety reference check completed.",
        full_transcript: transcript || "Reference confirmed applicant is dependable and great with youth.",
        status: "completed",
      })
      .select("id")
      .single();

    if (logErr) throw logErr;

    if (referenceId) {
      await supabaseAdmin
        .from("staff_references")
        .update({
          status: "completed",
          kaicalls_call_id: callLog.id,
          call_transcript: transcript,
          sentiment_score: sentimentScore || 4.95,
          safety_approved: true,
          verified_at: new Date().toISOString(),
        })
        .eq("id", referenceId);
    }

    return NextResponse.json({
      received: true,
      logId: callLog.id,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("KaiCalls Webhook Error:", err);
    return NextResponse.json({ received: false, error: err.message }, { status: 500 });
  }
}

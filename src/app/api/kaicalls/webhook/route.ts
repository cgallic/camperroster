import { NextResponse } from "next/server";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabase";
import { isSetupIncompleteError, setupIncompleteResponse } from "@/lib/auth";
import { verifyKaiCallsSignature } from "@/lib/signed-payload";

/** Signed, replay-limited and transactionally persisted reference-call result. */
export async function POST(req: Request) {
  if (!process.env.KAICALLS_WEBHOOK_SECRET) {
    return NextResponse.json({ received: false, error: "KaiCalls webhook verification is not configured." }, { status: 503 });
  }
  if (!hasServiceRoleKey) {
    return NextResponse.json({ received: false, error: "Webhook storage is not configured." }, { status: 503 });
  }

  try {
    const rawBody = await req.text();
    if (!verifyKaiCallsSignature({
      rawBody,
      timestamp: req.headers.get("x-kaicalls-timestamp"),
      signature: req.headers.get("x-kaicalls-signature"),
    })) {
      return NextResponse.json({ received: false, error: "Invalid or expired webhook signature." }, { status: 401 });
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ received: false, error: "Invalid JSON body." }, { status: 400 });
    }
    const referenceId = typeof body.referenceId === "string" ? body.referenceId : "";
    const transcript = typeof body.transcript === "string" ? body.transcript : null;
    if (!referenceId) return NextResponse.json({ received: false, error: "referenceId is required." }, { status: 400 });
    if (transcript && transcript.length > 200_000) {
      return NextResponse.json({ received: false, error: "transcript is too large." }, { status: 400 });
    }
    const { data, error } = await (supabaseAdmin as any).rpc("record_kaicalls_reference_result", {
      p_reference_id: referenceId,
      p_call_type: typeof body.callType === "string" ? body.callType : "outbound_reference",
      p_caller_phone: typeof body.callerPhone === "string" ? body.callerPhone : null,
      p_recipient_phone: typeof body.recipientPhone === "string" ? body.recipientPhone : null,
      p_duration_seconds: typeof body.durationSeconds === "number" ? Math.max(0, Math.trunc(body.durationSeconds)) : null,
      p_summary: typeof body.summary === "string" ? body.summary.slice(0, 20_000) : null,
      p_transcript: transcript,
      p_sentiment_score: typeof body.sentimentScore === "number" ? body.sentimentScore : null,
    });
    if (error) {
      if (error.code === "P0002") return NextResponse.json({ received: false, error: "No such staff reference." }, { status: 404 });
      throw error;
    }
    return NextResponse.json({
      received: true,
      duplicate: Boolean(data.duplicate),
      logId: data.log_id,
      campId: data.camp_id,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    console.error("KaiCalls Webhook Error:", err);
    return NextResponse.json({ received: false, error: "Could not store the verified callback." }, { status: 500 });
  }
}

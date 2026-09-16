import { NextResponse } from "next/server";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabase";
import { isSetupIncompleteError, setupIncompleteResponse } from "@/lib/auth";

/**
 * KaiCalls reference-call result webhook.
 *
 * Called by KaiCalls, not by a browser, so there is no session and SERVICE ROLE
 * is required. The tenant is NOT a constant: it is read off the staff_references
 * row this callback is about. Previously every call log was written to
 * organization_id = '11111111-1111-1111-1111-111111111111' regardless of which
 * camp the applicant had applied to.
 *
 * SECURITY NOTE (unfinished): this endpoint is unauthenticated. Anyone who can
 * POST to it can mark a volunteer reference "safety_approved". It needs a shared
 * secret or signature check from KaiCalls before it is relied on for a real
 * safeguarding decision. Deliberately left as-is rather than inventing a scheme
 * the caller does not send; see the TODO below.
 */
export async function POST(req: Request) {
  // TODO(security): verify a KAICALLS_WEBHOOK_SECRET header before trusting the
  // body. Until then a director should treat safety_approved as advisory.
  if (!hasServiceRoleKey) {
    return NextResponse.json(
      { received: false, error: "Webhook storage is not configured (SUPABASE_SERVICE_ROLE_KEY unset)." },
      { status: 503 }
    );
  }

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

    // ---- Resolve the tenant from the record, never from a constant ---------
    let campId: string | null = null;
    if (referenceId) {
      const { data: ref, error: refLookupErr } = await supabaseAdmin
        .from("staff_references")
        .select("id, camp_id")
        .eq("id", referenceId)
        .maybeSingle();

      if (refLookupErr) {
        if (isSetupIncompleteError(refLookupErr)) return setupIncompleteResponse(refLookupErr);
        throw refLookupErr;
      }
      if (!ref) {
        return NextResponse.json(
          { received: false, error: "No such staff reference. Nothing was written." },
          { status: 404 }
        );
      }
      campId = ref.camp_id ?? null;
    }

    if (!campId) {
      // No reference id, or the reference has no camp. Refuse rather than file
      // a call transcript under an arbitrary camp.
      return NextResponse.json(
        {
          received: false,
          error:
            "This call could not be attached to a camp (referenceId missing, or that reference has no camp_id). Nothing was written.",
        },
        { status: 400 }
      );
    }

    const { data: callLog, error: logErr } = await supabaseAdmin
      .from("kaicalls_logs")
      .insert({
        camp_id: campId,
        call_type: callType || "outbound_reference",
        caller_phone: callerPhone || null,
        recipient_phone: recipientPhone || null,
        duration_seconds: typeof durationSeconds === "number" ? durationSeconds : null,
        summary: summary || null,
        full_transcript: transcript || null,
        status: "completed",
      })
      .select("id")
      .single();

    if (logErr) throw logErr;

    const { error: updateErr } = await supabaseAdmin
      .from("staff_references")
      .update({
        status: "completed",
        kaicalls_call_id: callLog.id,
        call_transcript: transcript ?? null,
        sentiment_score: typeof sentimentScore === "number" ? sentimentScore : null,
        verified_at: new Date().toISOString(),
      })
      .eq("id", referenceId)
      .eq("camp_id", campId);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      received: true,
      logId: callLog.id,
      campId,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    console.error("KaiCalls Webhook Error:", err);
    return NextResponse.json({ received: false, error: err.message }, { status: 500 });
  }
}

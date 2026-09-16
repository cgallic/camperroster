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
 * POST to it, with a reference id, can write a call transcript, a sentiment
 * score and a "completed" status onto that reference — so the record a director
 * reads when deciding on a volunteer can be forged.
 *
 * It cannot set safety_approved: that column takes no default, and a check
 * constraint requires a named reviewer alongside any decision, so the clearance
 * itself can only come from a person. The exposure is the evidence, not the
 * verdict. Still needs a shared secret from KaiCalls; left as-is rather than
 * inventing a scheme the caller does not send. See the TODO below.
 */
export async function POST(req: Request) {
  // TODO(security): verify a KAICALLS_WEBHOOK_SECRET header before trusting the
  // body. Until then a director should treat the transcript and sentiment score
  // as unverified evidence rather than proof the call happened.
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

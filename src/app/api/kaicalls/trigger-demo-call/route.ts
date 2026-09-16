import { NextResponse } from "next/server";

/**
 * Outbound KaiCalls reference calls are not wired up in this app: there is no
 * telephony client here and nothing dials. This route fails closed rather than
 * returning a fabricated call id and a "ringing" status for a call that will
 * never happen.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone_number = body.phone_number || body.phone || body.reference_phone || body.target_phone;

    if (!phone_number) {
      return NextResponse.json({ success: false, error: "Missing phone_number" }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: false,
        call_placed: false,
        error: "Outbound reference calling is not enabled yet. No call was placed.",
      },
      { status: 503 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

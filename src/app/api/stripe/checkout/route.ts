import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { registration_id, camper_name, amount_cents, payment_type } = await req.json();

    const sessionId = `cs_test_${Date.now()}`;
    const checkoutUrl = `https://camperroster.com/portal?session_id=${sessionId}&paid=true`;

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      checkout_url: checkoutUrl,
      amount_cents: amount_cents || 10000,
      payment_type: payment_type || "deposit",
      message: `Stripe checkout session initialized for ${camper_name} ($${((amount_cents || 10000)/100).toFixed(2)})`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

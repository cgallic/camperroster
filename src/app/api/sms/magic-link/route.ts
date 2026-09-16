import { NextResponse } from "next/server";

/**
 * Builds a passwordless registration link for a phone number.
 * There is no SMS provider wired up, so this route returns the link and says
 * plainly that nothing was texted. It must never claim a message was sent.
 */
export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ success: false, error: "Missing phone" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      phone,
      sms_sent: false,
      magicLink: "https://camperroster.com/register?phone=" + encodeURIComponent(phone),
      message: "SMS delivery is not configured, so no text was sent. Share this link directly.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

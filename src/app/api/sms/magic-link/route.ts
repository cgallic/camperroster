import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    return NextResponse.json({
      success: true,
      phone,
      magicLink: "https://camperroster.com/register?phone=" + encodeURIComponent(phone),
      message: "Magic link SMS dispatched to " + phone
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

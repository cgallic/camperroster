import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { registration_id, amount_cents } = body;

    if (!registration_id || !amount_cents) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const { data: reg, error: fetchErr } = await supabaseAdmin
      .from("registrations")
      .select("canteen_balance_cents")
      .eq("id", registration_id)
      .single();

    if (fetchErr) throw fetchErr;

    const newBalance = (reg.canteen_balance_cents || 0) + amount_cents;

    const { data, error } = await supabaseAdmin
      .from("registrations")
      .update({ canteen_balance_cents: newBalance })
      .eq("id", registration_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      new_balance_cents: newBalance,
      message: `Successfully added $${(amount_cents / 100).toFixed(2)} to canteen wallet!`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { registration_id, checked_in } = await req.json();

    if (!registration_id) {
      return NextResponse.json({ success: false, error: "Missing registration_id" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("registrations")
      .update({
        checked_in: checked_in ?? true,
        checked_in_at: checked_in ? new Date().toISOString() : null
      })
      .eq("id", registration_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, registration: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

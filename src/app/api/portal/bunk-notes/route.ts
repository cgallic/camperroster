import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const camperName = searchParams.get("camper_name");

    let query = supabaseAdmin.from("bunk_notes").select("*").order("created_at", { ascending: false });
    if (camperName) {
      query = query.ilike("camper_name", `%${camperName}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, notes: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { camper_name, sender_name, sender_relation, message, delivery_date, registration_id } = body;

    const { data, error } = await supabaseAdmin.from("bunk_notes").insert({
      registration_id: registration_id || null,
      camper_name: camper_name || "Jamie Gallic",
      sender_name: sender_name || "Mom & Dad",
      sender_relation: sender_relation || "Parent",
      message: message,
      delivery_date: delivery_date || new Date().toISOString().split("T")[0]
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, note: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

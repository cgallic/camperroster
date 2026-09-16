import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isSetupIncompleteError, resolveCampOrRespond, setupIncompleteResponse } from "@/lib/auth";

/**
 * Bunk notes. Staff-only, tenant-scoped.
 *
 * Both handlers used to run on the service-role client with no auth and no camp
 * filter. GET returned every bunk note ever written, for every camp, to anyone
 * who called it — letters from named parents to named children. POST accepted
 * anonymous writes and silently defaulted the camper to "Jamie Gallic".
 *
 * Parent-facing submission is NOT what this route is. Wiring the household
 * portal to it would require parent authentication first.
 */

export async function GET(req: Request) {
  const resolved = await resolveCampOrRespond();
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  try {
    const { searchParams } = new URL(req.url);
    const camperName = searchParams.get("camper_name");

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("bunk_notes")
      .select("*")
      .eq("camp_id", camp.campId)
      .order("created_at", { ascending: false });

    if (camperName) {
      query = query.ilike("camper_name", `%${camperName}%`);
    }

    const { data, error } = await query;
    if (error) {
      if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
      throw error;
    }

    return NextResponse.json({ success: true, notes: data || [] });
  } catch (err: any) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const resolved = await resolveCampOrRespond();
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  try {
    const body = await req.json();
    const { camper_name, sender_name, sender_relation, message, delivery_date, registration_id } = body;

    // No invented camper or sender. A letter addressed to a default child is
    // worse than a rejected form.
    const missing: string[] = [];
    if (!camper_name) missing.push("camper_name");
    if (!sender_name) missing.push("sender_name");
    if (!message) missing.push("message");
    if (missing.length) {
      return NextResponse.json(
        { success: false, error: `Missing required field(s): ${missing.join(", ")}.` },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // A registration_id, if given, must belong to this camp.
    if (registration_id) {
      const { data: reg, error: regErr } = await supabase
        .from("registrations")
        .select("id")
        .eq("id", registration_id)
        .eq("camp_id", camp.campId)
        .maybeSingle();

      if (regErr) {
        if (isSetupIncompleteError(regErr)) return setupIncompleteResponse(regErr);
        throw regErr;
      }
      if (!reg) {
        return NextResponse.json(
          { success: false, error: "No such registration in your camp. Nothing was saved." },
          { status: 404 }
        );
      }
    }

    const { data, error } = await supabase
      .from("bunk_notes")
      .insert({
        camp_id: camp.campId,
        registration_id: registration_id || null,
        camper_name,
        sender_name,
        sender_relation: sender_relation || null,
        message,
        delivery_date: delivery_date || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
      throw error;
    }

    return NextResponse.json({ success: true, note: data });
  } catch (err: any) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isSetupIncompleteError, resolveCampWithRolesOrRespond, setupIncompleteResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const resolved = await resolveCampWithRolesOrRespond(["nurse"]);
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: campers, error: camperError } = await supabase
      .from("campers")
      .select("id, legal_first_name, legal_last_name, preferred_name, grade_entering")
      .eq("camp_id", camp.campId);

    if (camperError) {
      if (isSetupIncompleteError(camperError)) return setupIncompleteResponse(camperError);
      throw camperError;
    }

    const camperById = new Map((campers ?? []).map((camper) => [camper.id, camper]));
    const camperIds = [...camperById.keys()];
    if (camperIds.length === 0) {
      return NextResponse.json({ success: true, camp: { campId: camp.campId, campName: camp.campName }, medications: [] });
    }

    const { data, error } = await supabase
      .from("emar_logs")
      .select("id, camper_id, medication_name, dosage, scheduled_time, administered_at, administered_by, notes")
      .in("camper_id", camperIds)
      .order("scheduled_time", { ascending: true });

    if (error) {
      if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
      throw error;
    }

    const medications = (data ?? []).map((row) => {
      const camper = camperById.get(row.camper_id);
      const legalName = [camper?.legal_first_name, camper?.legal_last_name].filter(Boolean).join(" ").trim();
      return {
        id: row.id,
        camperId: row.camper_id,
        camperName: camper?.preferred_name || legalName || `Camper ${String(row.camper_id).slice(0, 8)}`,
        grade: camper?.grade_entering ?? null,
        medication: row.medication_name,
        dosage: row.dosage,
        scheduledTime: row.scheduled_time,
        administeredAt: row.administered_at,
        administeredBy: row.administered_by,
        notes: row.notes,
      };
    });

    return NextResponse.json({ success: true, camp: { campId: camp.campId, campName: camp.campName }, medications });
  } catch (err: any) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const resolved = await resolveCampWithRolesOrRespond(["nurse"]);
  if (resolved.response) return resolved.response;
  const { camp } = resolved;

  try {
    const { medication_id, notes } = await req.json();
    if (!medication_id) {
      return NextResponse.json({ success: false, error: "Missing medication_id" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const actor = userData?.user?.email || userData?.user?.id;
    if (!actor) {
      return NextResponse.json({ success: false, error: "Unable to identify the administering nurse." }, { status: 401 });
    }

    const { data: medication, error: medicationError } = await supabase
      .from("emar_logs")
      .select("id, camper_id, administered_at")
      .eq("id", medication_id)
      .maybeSingle();

    if (medicationError) {
      if (isSetupIncompleteError(medicationError)) return setupIncompleteResponse(medicationError);
      throw medicationError;
    }
    if (!medication) {
      return NextResponse.json({ success: false, error: "Medication record not found." }, { status: 404 });
    }
    if (medication.administered_at) {
      return NextResponse.json({ success: false, error: "This dose was already administered." }, { status: 409 });
    }

    const { data: camper, error: camperError } = await supabase
      .from("campers")
      .select("id")
      .eq("id", medication.camper_id)
      .eq("camp_id", camp.campId)
      .maybeSingle();
    if (camperError) {
      if (isSetupIncompleteError(camperError)) return setupIncompleteResponse(camperError);
      throw camperError;
    }
    if (!camper) {
      return NextResponse.json({ success: false, error: "Medication record not found in your camp." }, { status: 404 });
    }

    const administeredAt = new Date().toISOString();
    const update: { administered_at: string; administered_by: string; notes?: string } = {
      administered_at: administeredAt,
      administered_by: actor,
    };
    if (typeof notes === "string" && notes.trim()) update.notes = notes.trim().slice(0, 1000);

    const { data, error } = await supabase
      .from("emar_logs")
      .update(update)
      .eq("id", medication.id)
      .is("administered_at", null)
      .select("id, administered_at, administered_by, notes")
      .maybeSingle();

    if (error) {
      if (isSetupIncompleteError(error)) return setupIncompleteResponse(error);
      throw error;
    }
    if (!data) {
      return NextResponse.json({ success: false, error: "This dose was already administered." }, { status: 409 });
    }

    return NextResponse.json({ success: true, medication: data });
  } catch (err: any) {
    if (isSetupIncompleteError(err)) return setupIncompleteResponse(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

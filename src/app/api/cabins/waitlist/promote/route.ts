import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCabinAdmin, badRequest, fromZod } from "../../_guard";

const BodySchema = z.object({
  waitlistEntryId: z.string().uuid(),
  /** Omit to let the database pick the first matching cabin with room. */
  cabinId: z.string().uuid().optional(),
  override: z.boolean().optional(),
});

export async function POST(req: Request) {
  const guard = await requireCabinAdmin();
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);
  const { waitlistEntryId, cabinId, override } = parsed.data;

  const { data: entry, error: entryError } = await guard.supabase
    .from("waitlist_entries")
    .select("id, camp_id, registration_id, status, gender, grade")
    .eq("id", waitlistEntryId)
    .maybeSingle();

  if (entryError) return NextResponse.json({ error: entryError.message }, { status: 400 });
  if (!entry) return badRequest("That waitlist entry no longer exists");
  if (!entry.registration_id) return badRequest("Only camper waitlist entries can be promoted here");
  if (entry.status === "accepted") return badRequest("That entry was already promoted");
  if (entry.status === "withdrawn" || entry.status === "declined") {
    return badRequest(`That family already ${entry.status} their spot`);
  }

  let placedCabinId: string | null = null;

  if (cabinId) {
    const { data: destination, error: destError } = await guard.supabase
      .from("cabin_occupancy")
      .select("cabin_id, name, capacity, campers_assigned, spots_remaining")
      .eq("cabin_id", cabinId)
      .maybeSingle();
    if (destError) return NextResponse.json({ error: destError.message }, { status: 400 });
    if (!destination) return badRequest("That cabin no longer exists");

    if (destination.spots_remaining <= 0 && !override) {
      return badRequest(
        `${destination.name} is full (${destination.campers_assigned}/${destination.capacity}). Raise the cap or resend with override.`,
        { full: true },
      );
    }

    const { error } = await guard.supabase.from("cabin_assignments").insert({
      camp_id: entry.camp_id,
      cabin_id: cabinId,
      registration_id: entry.registration_id,
      occupant_role: "camper",
      assigned_by: guard.userId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    placedCabinId = cabinId;
  } else {
    const { data: rpcCabinId, error } = await guard.supabase.rpc("assign_camper_to_cabin", {
      p_registration_id: entry.registration_id,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!rpcCabinId) {
      // Still nothing open for this bucket: leave the entry queued in place.
      return badRequest("No cabin for that grade and gender has room yet. Raise a cap or add a cabin first.");
    }
    placedCabinId = rpcCabinId as string;
  }

  const { error: updateError } = await guard.supabase
    .from("waitlist_entries")
    .update({ status: "accepted", offered_at: new Date().toISOString() })
    .eq("id", waitlistEntryId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ promoted: true, cabinId: placedCabinId, waitlistEntryId });
}

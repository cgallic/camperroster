import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCabinAdmin, fromZod } from "../_guard";

const BodySchema = z.object({ registrationId: z.string().uuid() });

/** Runs the database placement function: first matching cabin with room, else the waitlist. */
export async function POST(req: Request) {
  const guard = await requireCabinAdmin();
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZod(parsed.error);

  const { data: cabinId, error } = await guard.supabase.rpc("assign_camper_to_cabin", {
    p_registration_id: parsed.data.registrationId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (!cabinId) {
    const { data: entry } = await guard.supabase
      .from("waitlist_entries")
      .select("id, position")
      .eq("registration_id", parsed.data.registrationId)
      .eq("status", "waiting")
      .maybeSingle();

    return NextResponse.json({
      placed: false,
      waitlisted: true,
      waitlistEntryId: entry?.id ?? null,
      position: entry?.position ?? null,
    });
  }

  const { data: cabin } = await guard.supabase
    .from("cabin_occupancy")
    .select("cabin_id, name, campers_assigned, capacity, spots_remaining")
    .eq("cabin_id", cabinId)
    .maybeSingle();

  return NextResponse.json({ placed: true, waitlisted: false, cabinId, cabin: cabin ?? null });
}

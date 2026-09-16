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
    .select("id, registration_id, status")
    .eq("id", waitlistEntryId)
    .maybeSingle();

  if (entryError) return NextResponse.json({ error: entryError.message }, { status: 400 });
  if (!entry) return badRequest("That waitlist entry no longer exists");
  if (!entry.registration_id) return badRequest("Only camper waitlist entries can be promoted here");
  if (entry.status === "accepted") return badRequest("That entry was already promoted");
  if (entry.status === "withdrawn" || entry.status === "declined") {
    return badRequest(`That family already ${entry.status} their spot`);
  }

  // Seating and marking the entry accepted happen in one locked transaction, so
  // a failed placement cannot leave someone marked accepted with no bed, and two
  // admins promoting at once cannot both be handed the same last spot.
  const { data: placedCabinId, error } = await guard.supabase.rpc("promote_from_waitlist", {
    p_waitlist_entry_id: waitlistEntryId,
    p_cabin_id: cabinId ?? undefined,
    p_override: Boolean(override),
  });

  if (error) {
    const status = error.code === "42501" ? 403 : 400;
    return NextResponse.json({ error: error.message, full: error.code === "23514" }, { status });
  }

  if (!placedCabinId) {
    // Nothing open for this bucket. The entry keeps its place in the queue.
    return badRequest("No cabin for that grade and gender has room yet. Raise a cap or add a cabin first.");
  }

  return NextResponse.json({ promoted: true, cabinId: placedCabinId, waitlistEntryId });
}

"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isIsoDate } from "@/lib/camp-settings";
import { MEETING_ROLES } from "./roles";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

/** Adds a meeting to sign people in to, e.g. the volunteer mandatory meeting. */
export async function createMeeting(input: { name: string; heldOn: string }): Promise<ActionResult & { id?: string }> {
  const membership = await requireRole([...MEETING_ROLES], "/admin/meetings");
  const name = input.name.trim();
  if (!name || name.length > 200) return { ok: false, message: "Give the meeting a name." };
  const heldOn = input.heldOn.trim() || null;
  if (heldOn && !isIsoDate(heldOn)) return { ok: false, message: "That date could not be read." };

  const supabase = await createClient();
  const [{ data: season }, { data: auth }] = await Promise.all([
    supabase.from("seasons").select("id").eq("camp_id", membership.campId).eq("is_active", true).limit(1).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const { data, error } = await supabase
    .from("staff_meetings")
    .insert({
      camp_id: membership.campId,
      season_id: season?.id ?? null,
      name,
      held_on: heldOn,
      created_by: auth.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: error?.message ?? "The meeting was not saved." };
  revalidatePath("/admin/meetings");
  return { ok: true, message: "Meeting added.", id: data.id };
}

/** Signs one person in to a meeting, or undoes it. */
export async function setMeetingSignIn(input: {
  meetingId: string;
  staffApplicationId: string;
  signedIn: boolean;
}): Promise<ActionResult & { signedInAt?: string | null }> {
  const membership = await requireRole([...MEETING_ROLES], "/admin/meetings");
  const supabase = await createClient();

  if (!input.signedIn) {
    const { error } = await supabase
      .from("staff_meeting_attendance")
      .delete()
      .eq("camp_id", membership.campId)
      .eq("meeting_id", input.meetingId)
      .eq("staff_application_id", input.staffApplicationId);
    if (error) return { ok: false, message: error.message };
    revalidatePath(`/admin/meetings/${input.meetingId}`);
    return { ok: true, message: "Sign-in undone.", signedInAt: null };
  }

  // Signing in twice keeps the first time, which is the one that matters.
  const { data, error } = await supabase
    .from("staff_meeting_attendance")
    .upsert(
      { camp_id: membership.campId, meeting_id: input.meetingId, staff_application_id: input.staffApplicationId },
      { onConflict: "meeting_id,staff_application_id", ignoreDuplicates: true },
    )
    .select("signed_in_at")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/admin/meetings/${input.meetingId}`);
  return { ok: true, message: "Signed in.", signedInAt: data?.signed_in_at ?? new Date().toISOString() };
}

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCamp, isSetupIncompleteError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  friendlyDbError,
  parseCampDetails,
  parseSeason,
  parseSession,
  parseTiers,
} from "@/lib/camp-settings";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

const PATH = "/admin/settings";

/**
 * Every action re-resolves the camp from the session. The camp id is never
 * taken from the request, and the role is checked here as well as by RLS:
 * `camp_sessions` lets any member write, so the database alone would not stop
 * a counselor.
 */
async function directorCamp(): Promise<{ campId: string } | { error: ActionResult }> {
  try {
    const camp = await getCurrentCamp();
    if (!camp) return { error: { ok: false, message: "Sign in as the camp director to change settings." } };
    if (camp.role !== "director") return { error: { ok: false, message: "Only the camp director can change camp settings." } };
    return { campId: camp.campId };
  } catch (err) {
    if (isSetupIncompleteError(err)) return { error: { ok: false, message: "This camp's database setup is incomplete." } };
    throw err;
  }
}

const NOTHING_SAVED: ActionResult = {
  ok: false,
  message: "Nothing was saved. The record may have been removed, or your account cannot change it.",
};

// Camp details ---------------------------------------------------------------------

export async function saveCampDetails(input: unknown): Promise<ActionResult> {
  const guard = await directorCamp();
  if ("error" in guard) return guard.error;
  const parsed = parseCampDetails(input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("camps")
    .update(parsed.data)
    .eq("id", guard.campId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: friendlyDbError(error) };
  if (!data) return NOTHING_SAVED;

  revalidatePath(PATH);
  return { ok: true, message: "Camp details saved." };
}

// Seasons ----------------------------------------------------------------------------

export async function createSeason(input: unknown): Promise<ActionResult> {
  const guard = await directorCamp();
  if ("error" in guard) return guard.error;
  const parsed = parseSeason(input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasons")
    .insert({ ...parsed.data, camp_id: guard.campId, is_active: false })
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: friendlyDbError(error, `A season for ${parsed.data.year}`) };
  if (!data) return NOTHING_SAVED;

  revalidatePath(PATH);
  return { ok: true, message: `${parsed.data.name} added. Make it active when you're ready to open it.` };
}

export async function updateSeason(seasonId: string, input: unknown): Promise<ActionResult> {
  const guard = await directorCamp();
  if ("error" in guard) return guard.error;
  const parsed = parseSeason(input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasons")
    .update(parsed.data)
    .eq("id", seasonId)
    .eq("camp_id", guard.campId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: friendlyDbError(error, `A season for ${parsed.data.year}`) };
  if (!data) return NOTHING_SAVED;

  revalidatePath(PATH);
  revalidatePath("/admin/forms");
  return { ok: true, message: "Season saved." };
}

/**
 * Exactly one active season. The chosen one is switched on first and the rest
 * switched off after, so a failure part-way leaves two active seasons for a
 * moment rather than none (registration, forms and invoicing all read "the
 * active season", and none is worse than a brief overlap).
 */
export async function setActiveSeason(seasonId: string): Promise<ActionResult> {
  const guard = await directorCamp();
  if ("error" in guard) return guard.error;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasons")
    .update({ is_active: true })
    .eq("id", seasonId)
    .eq("camp_id", guard.campId)
    .select("id, name")
    .maybeSingle();
  if (error) return { ok: false, message: friendlyDbError(error) };
  if (!data) return NOTHING_SAVED;

  const { error: clearError } = await supabase
    .from("seasons")
    .update({ is_active: false })
    .eq("camp_id", guard.campId)
    .eq("is_active", true)
    .neq("id", seasonId);
  if (clearError) {
    return { ok: false, message: `${data.name} is active, but the previous season could not be switched off: ${clearError.message}` };
  }

  revalidatePath(PATH);
  revalidatePath("/admin/forms");
  revalidatePath("/admin");
  return { ok: true, message: `${data.name} is now the active season.` };
}

// Sessions ------------------------------------------------------------------------------

export async function createSession(input: unknown): Promise<ActionResult> {
  const guard = await directorCamp();
  if ("error" in guard) return guard.error;
  const parsed = parseSession(input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("camp_sessions")
    .insert({ ...parsed.data, camp_id: guard.campId, organization_id: null, is_active: true })
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: friendlyDbError(error, "That session") };
  if (!data) return NOTHING_SAVED;

  revalidatePath(PATH);
  return { ok: true, message: `${parsed.data.name} added.` };
}

export async function updateSession(sessionId: string, input: unknown): Promise<ActionResult> {
  const guard = await directorCamp();
  if ("error" in guard) return guard.error;
  const parsed = parseSession(input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("camp_sessions")
    .update(parsed.data)
    .eq("id", sessionId)
    .eq("camp_id", guard.campId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: friendlyDbError(error, "That session") };
  if (!data) return NOTHING_SAVED;

  revalidatePath(PATH);
  return { ok: true, message: "Session saved." };
}

/**
 * Sessions are switched off, never deleted: registrations reference them, and a
 * deleted session would take its cabins with it.
 */
export async function setSessionActive(sessionId: string, active: boolean): Promise<ActionResult> {
  const guard = await directorCamp();
  if ("error" in guard) return guard.error;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("camp_sessions")
    .update({ is_active: active })
    .eq("id", sessionId)
    .eq("camp_id", guard.campId)
    .select("id, name")
    .maybeSingle();
  if (error) return { ok: false, message: friendlyDbError(error) };
  if (!data) return NOTHING_SAVED;

  revalidatePath(PATH);
  return {
    ok: true,
    message: active
      ? `${data.name} is open again.`
      : `${data.name} is switched off. Existing registrations are kept; new families can't pick it.`,
  };
}

// Pricing tiers ------------------------------------------------------------------------------

/**
 * Writes the 1–4 camper rates for one season. These are the rows
 * `family_tuition_cents` reads when an invoice is priced; invoices already
 * priced keep the amount they were given.
 */
export async function savePricingTiers(seasonId: string, input: unknown): Promise<ActionResult> {
  const guard = await directorCamp();
  if ("error" in guard) return guard.error;
  const parsed = parseTiers(input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("id", seasonId)
    .eq("camp_id", guard.campId)
    .maybeSingle();
  if (seasonError) return { ok: false, message: friendlyDbError(seasonError) };
  if (!season) return { ok: false, message: "That season does not belong to this camp." };

  const rows = parsed.data.map((tier) => ({ ...tier, camp_id: guard.campId, season_id: season.id }));
  const { data, error } = await supabase
    .from("pricing_tiers")
    .upsert(rows, { onConflict: "season_id,camper_count" })
    .select("id");
  if (error) return { ok: false, message: friendlyDbError(error) };
  if (!data || data.length !== rows.length) return NOTHING_SAVED;

  revalidatePath(PATH);
  revalidatePath("/admin/finance");
  return { ok: true, message: `Family pricing for ${season.name} saved. New invoices use these rates.` };
}

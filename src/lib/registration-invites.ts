import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The director's registration switch and private invite links.
 *
 * Only a token's SHA-256 is stored (see registration_invites), so the link is
 * shown once, when it is made. The database helpers take the client as an
 * argument so public intake (service role) and the admin pages (RLS) share
 * them.
 */

export function newInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** The path a family opens. The camp slug is required by the public form. */
export function invitePath(audience: string, campSlug: string, token: string): string {
  return `/register/${encodeURIComponent(audience)}?camp=${encodeURIComponent(campSlug)}&token=${encodeURIComponent(token)}`;
}

/** Postgres "undefined column": the switch's migration is not applied yet. */
const UNDEFINED_COLUMN = "42703";

/**
 * Whether the camp's registration switch is on. Before the migration lands the
 * column is missing and nobody can have turned it off, so that one case reads
 * as open; any other failure reads as closed rather than letting intake through.
 */
export async function campRegistrationOpen(db: SupabaseClient<any>, campId: string): Promise<boolean> {
  const { data, error } = await db.from("camps").select("registration_open").eq("id", campId).maybeSingle();
  if (error) return error.code === UNDEFINED_COLUMN;
  return (data as { registration_open?: boolean } | null)?.registration_open !== false;
}

/** The live (unrevoked) invite for this period matching the token, or null. */
export async function findLiveInvite(
  db: SupabaseClient<any>,
  periodId: string,
  token: string | null | undefined,
): Promise<{ id: string } | null> {
  if (!token) return null;
  const { data, error } = await db
    .from("registration_invites")
    .select("id")
    .eq("period_id", periodId)
    .eq("token_sha256", hashInviteToken(token))
    .is("revoked_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return data as { id: string };
}

/** Everything canViewPeriod needs beyond the period row itself. */
export async function loadPeriodAccess(
  db: SupabaseClient<any>,
  campId: string,
  periodId: string,
  token: string | null | undefined,
): Promise<{ campOpen: boolean; inviteId: string | null }> {
  const [campOpen, invite] = await Promise.all([
    campRegistrationOpen(db, campId),
    findLiveInvite(db, periodId, token),
  ]);
  return { campOpen, inviteId: invite?.id ?? null };
}

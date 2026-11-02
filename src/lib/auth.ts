/**
 * Who is signed in, which camp they are acting for, and what they may see.
 *
 * Three things live here, and they answer different questions:
 *
 *   - `getCurrentCamp` / `resolveCampOrRespond` resolve the TENANT. Nothing here
 *     ever falls back to a default camp; guessing one is how a camp ends up
 *     reading another camp's children.
 *   - `requireRole` / `requireArea` resolve PERMISSION within that camp, so the
 *     nurse's pages and the registrar's are not the same door.
 *   - `SetupIncompleteError` separates "the database has not been migrated" from
 *     "you have no access". Both otherwise look like an empty roster, and one of
 *     them is a deployment problem someone needs to be told about.
 */

import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "./supabase/server";

export const ROLES = ["director", "registrar", "nurse", "red_shirt", "counselor", "staff"] as const;
export type Role = (typeof ROLES)[number];

export type Membership = { campId: string; role: Role };

export interface CurrentCamp {
  campId: string;
  campName: string;
  slug: string;
  role: string;
}

/** Roles each guarded area admits. Directors are added to every set below. */
const AREA_ROLES: Record<string, Role[]> = {
  admin: ["registrar"],
  nurse: ["nurse"],
  counselor: ["counselor", "red_shirt", "staff", "nurse", "registrar"],
  canteen: ["staff", "counselor", "registrar"],
};

export function rolesForArea(area: keyof typeof AREA_ROLES | string): Role[] {
  return ["director", ...(AREA_ROLES[area] ?? [])];
}

// Setup detection ---------------------------------------------------------------

/**
 * Thrown when the tenancy migration has not been applied — `camp_members` is
 * missing, `camp_id` does not exist, or PostgREST has no relationship cached.
 * This is a deployment state, not a user error, and must surface as 503 rather
 * than as a 401 or a silent empty result that reads as "this camp has no
 * campers".
 */
export class SetupIncompleteError extends Error {
  readonly code = "setup_incomplete";
  constructor(message = "Database setup is incomplete: apply supabase/migrations/0001_tenancy_and_auth.sql.") {
    super(message);
    this.name = "SetupIncompleteError";
  }
}

/** Postgres and PostgREST codes that mean "the tenancy migration is missing". */
const SETUP_ERROR_CODES = new Set([
  "42P01", // undefined_table    -> camp_members does not exist
  "42703", // undefined_column   -> camp_id does not exist
  "42883", // undefined_function -> is_camp_member() does not exist
  "PGRST200", // embedded relationship not found in schema cache
  "PGRST202", // function not found in schema cache
  "PGRST204", // column not found in schema cache
]);

export function isSetupIncompleteError(err: unknown): boolean {
  if (err instanceof SetupIncompleteError) return true;
  if (!err || typeof err !== "object") return false;

  const code = (err as { code?: unknown }).code;
  if (typeof code === "string" && SETUP_ERROR_CODES.has(code)) return true;

  const message = (err as { message?: unknown }).message;
  if (typeof message === "string") {
    const m = message.toLowerCase();
    if (m.includes("camp_members") && m.includes("does not exist")) return true;
    if (m.includes("camp_id") && m.includes("does not exist")) return true;
    if (m.includes("schema cache")) return true;
  }
  return false;
}

// Session and tenant -------------------------------------------------------------

/** The signed-in Supabase user, or null. Never throws on "no session". */
export async function getCurrentUser(): Promise<{ id: string; email: string | null } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/**
 * The camp the signed-in user is acting for.
 *
 * @returns the camp, or null when nobody is signed in or the user belongs to no camp.
 * @throws  SetupIncompleteError when the tenancy migration has not been applied.
 */
export async function getCurrentCamp(): Promise<CurrentCamp | null> {
  const supabase = await createClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return null;

  const { data, error } = await supabase
    .from("camp_members")
    .select("camp_id, role, created_at, camps(name, slug)")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    if (isSetupIncompleteError(error)) throw new SetupIncompleteError(error.message);
    throw error;
  }

  let row = data?.[0];
  if (!row) {
    // A signed-in user with no camp may still hold an unaccepted invitation:
    // they signed in or reset their password instead of pressing "Accept" on
    // the invite page. Without this they bounce back to "Sign in to your camp"
    // while the header shows them signed in (Camp Hope's director, Nov 2026).
    if (!(await claimPendingInvitation(userData.user))) return null;
    const retry = await supabase
      .from("camp_members")
      .select("camp_id, role, created_at, camps(name, slug)")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: true })
      .limit(1);
    if (retry.error) throw retry.error;
    row = retry.data?.[0];
    if (!row) return null;
  }

  // PostgREST types a to-one embed as an array in some versions; normalise.
  const camp = Array.isArray(row.camps) ? row.camps[0] : row.camps;

  return {
    campId: row.camp_id,
    campName: camp?.name ?? "",
    slug: camp?.slug ?? "",
    role: row.role,
  };
}

/**
 * Accept the newest pending, unexpired staff invitation addressed to this
 * user's confirmed email. This does what pressing "Accept invitation" would
 * have done: the invitation was sent to this address, and the address is
 * verified, which is the same proof accept_staff_invitation() relies on.
 *
 * Only called for a user who belongs to no camp, so the one-account-one-camp
 * rule holds. Returns true when a membership was created.
 */
export async function claimPendingInvitation(user: {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
}): Promise<boolean> {
  const email = user.email?.trim().toLowerCase();
  if (!email || !user.email_confirmed_at) return false;

  const admin = createAdminClient() as any;
  const { data: invites, error } = await admin
    .from("staff_invitations")
    .select("id, camp_id, role, email, invited_at")
    .ilike("email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("invited_at", { ascending: false })
    .limit(5);
  if (error) return false;

  // ilike treats "_" as a wildcard; insist on an exact match.
  const invite = (invites ?? []).find((i: { email: string }) => i.email.trim().toLowerCase() === email);
  if (!invite) return false;

  const { error: memberError } = await admin
    .from("camp_members")
    .upsert({ camp_id: invite.camp_id, user_id: user.id, role: invite.role }, { onConflict: "camp_id,user_id" });
  if (memberError) return false;

  await admin
    .from("staff_invitations")
    .update({ status: "accepted", accepted_by: user.id, accepted_at: new Date().toISOString() })
    .eq("id", invite.id)
    .eq("status", "pending");
  return true;
}

/** The same lookup, shaped for the page guards. Null rather than throwing. */
export async function getMembership(): Promise<Membership | null> {
  let camp: CurrentCamp | null;
  try {
    camp = await getCurrentCamp();
  } catch (err) {
    // A page cannot render a 503, and pretending the user has no access would
    // send them to /no-access for what is actually a missing migration.
    if (isSetupIncompleteError(err)) redirect("/setup-incomplete");
    throw err;
  }
  return camp ? { campId: camp.campId, role: camp.role as Role } : null;
}

// Page guards --------------------------------------------------------------------

/** Redirects to login when signed out, or to /no-access when the role is wrong. */
export async function requireRole(allowed: Role[], returnTo: string): Promise<Membership> {
  const membership = await getMembership();
  if (!membership) {
    // Signed in but on no camp's team: sending them to the sign-in page again
    // looks like the sign-in failed.
    if (await getCurrentUser()) redirect("/no-access?reason=no_camp");
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  if (!allowed.includes(membership.role)) redirect("/no-access");
  return membership;
}

export async function requireArea(area: string, returnTo: string): Promise<Membership> {
  return requireRole(rolesForArea(area), returnTo);
}

// API route responses ------------------------------------------------------------

/**
 * Standard responses so every tenant-scoped route degrades identically.
 *
 * 503 -> migrations not applied (a deployment problem)
 * 401 -> not signed in
 * 403 -> signed in but belongs to no camp
 */
export function setupIncompleteResponse(err?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: "setup_incomplete",
      message:
        "This deployment's database has not been migrated yet. Apply the migrations in supabase/migrations, then retry.",
      detail: err instanceof Error ? err.message : undefined,
    },
    { status: 503 }
  );
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: "unauthenticated", message: "Sign in to continue." },
    { status: 401 }
  );
}

export function noCampResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "no_camp",
      message: "Your account is not a member of any camp. Ask your camp director for an invite.",
    },
    { status: 403 }
  );
}

export function forbiddenResponse(message = "Your role cannot perform this action.") {
  return NextResponse.json(
    { success: false, error: "forbidden", message },
    { status: 403 }
  );
}

/**
 * Resolve the camp for a tenant-scoped API route.
 *
 * Returns either `{ camp }` or `{ response }` — a ready-made 401/403/503. There
 * is deliberately no third outcome: a route can never proceed without a camp.
 */
export async function resolveCampOrRespond(): Promise<
  { camp: CurrentCamp; response?: never } | { camp?: never; response: NextResponse }
> {
  let camp: CurrentCamp | null;
  try {
    camp = await getCurrentCamp();
  } catch (err) {
    if (isSetupIncompleteError(err)) return { response: setupIncompleteResponse(err) };
    throw err;
  }

  if (camp === null) {
    const user = await getCurrentUser();
    return { response: user ? noCampResponse() : unauthorizedResponse() };
  }

  return { camp };
}

/** Resolve tenant and enforce one of the named roles for JSON API routes. */
export async function resolveCampWithRolesOrRespond(
  allowed: readonly Role[]
): Promise<{ camp: CurrentCamp; response?: never } | { camp?: never; response: NextResponse }> {
  const resolved = await resolveCampOrRespond();
  if (resolved.response) return resolved;
  const role = resolved.camp.role as Role;
  if (role !== "director" && !allowed.includes(role)) {
    return { response: forbiddenResponse() };
  }
  return { camp: resolved.camp };
}

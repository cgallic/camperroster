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
import { createClient } from "./supabase/server";

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

  const row = data?.[0];
  if (!row) return null;

  // PostgREST types a to-one embed as an array in some versions; normalise.
  const camp = Array.isArray(row.camps) ? row.camps[0] : row.camps;

  return {
    campId: row.camp_id,
    campName: camp?.name ?? "",
    slug: camp?.slug ?? "",
    role: row.role,
  };
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
  if (!membership) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
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

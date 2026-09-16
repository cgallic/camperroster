import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "./supabase-server";

/**
 * Session -> tenant resolution.
 *
 * Nothing in this file ever falls back to a default camp. If a camp cannot be
 * resolved from the signed-in user's membership, the answer is `null` (caller
 * returns 401/403), or `SetupIncompleteError` (caller returns 503). Guessing a
 * tenant is how one camp ends up reading another camp's children.
 */

export interface CurrentCamp {
  campId: string;
  campName: string;
  slug: string;
  role: string;
}

/**
 * Thrown when the database has not had supabase/migrations/0001 applied yet —
 * camp_members is missing, camp_id does not exist on a table, or PostgREST has
 * no relationship in its schema cache. This is a deployment state, not a user
 * error, and must surface as 503 "setup incomplete", never as 401 and never as
 * a silent empty result that looks like "this camp has no campers".
 */
export class SetupIncompleteError extends Error {
  readonly code = "setup_incomplete";
  constructor(message = "Database setup is incomplete: run supabase/migrations/0001_tenancy_and_auth.sql.") {
    super(message);
    this.name = "SetupIncompleteError";
  }
}

/** PostgREST/Postgres codes that mean "the tenancy migration has not been applied". */
const SETUP_ERROR_CODES = new Set([
  "42P01", // undefined_table       -> camp_members does not exist
  "42703", // undefined_column      -> camp_id does not exist
  "42883", // undefined_function    -> is_camp_member() does not exist
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

/** The signed-in Supabase user, or null. Never throws on "no session". */
export async function getCurrentUser(): Promise<{ id: string; email: string | null } | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/**
 * Resolve the camp the signed-in user is acting for.
 *
 * SIGNATURE IS LOAD-BEARING — other workstreams (billing) compile against it.
 * Do not change the shape without telling them.
 *
 * @returns the camp, or null when nobody is signed in / the user belongs to no camp.
 * @throws  SetupIncompleteError when migration 0001 has not been applied.
 */
export async function getCurrentCamp(): Promise<CurrentCamp | null> {
  const supabase = await createServerSupabaseClient();

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

  const row = data?.[0] as
    | { camp_id: string; role: string; camps: { name: string; slug: string } | { name: string; slug: string }[] | null }
    | undefined;

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
        "This deployment's database has not been migrated yet. Apply supabase/migrations/0001_tenancy_and_auth.sql, then retry.",
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

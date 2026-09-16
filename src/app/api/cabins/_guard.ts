import { NextResponse } from "next/server";
import { getMembership, rolesForArea, type Membership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Cabin placement is a registrar/director action. Route handlers cannot use
 * `requireRole` directly because it redirects; they need a JSON refusal, so we
 * reuse the same role set and answer with a status code instead.
 */
export async function requireCabinAdmin(): Promise<
  | { ok: true; membership: Membership; userId: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; response: NextResponse }
> {
  const membership = await getMembership();
  if (!membership) {
    return { ok: false, response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }
  if (!rolesForArea("admin").includes(membership.role)) {
    return { ok: false, response: NextResponse.json({ error: "Your role cannot change cabin placements" }, { status: 403 }) };
  }
  // Request-scoped client: every write below still goes through RLS.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }
  return { ok: true, membership, userId: user.id, supabase };
}

export function badRequest(message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status: 400 });
}

export function fromZod(error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] }) {
  const first = error.issues[0];
  const path = first ? first.path.map(String).join(".") : "";
  return badRequest(first ? `${path || "body"}: ${first.message}` : "Invalid request body");
}

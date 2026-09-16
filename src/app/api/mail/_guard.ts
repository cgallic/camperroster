import { NextResponse } from "next/server";
import { getMembership, rolesForArea, type Membership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * The review queue is admin work. Like the cabins guard, this answers with a
 * status code rather than redirecting, because these routes are called by
 * `fetch` from the mail screen.
 */
export async function requireMailAdmin(): Promise<
  | { ok: true; membership: Membership; userId: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; response: NextResponse }
> {
  const membership = await getMembership();
  if (!membership) {
    return { ok: false, response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }
  if (!rolesForArea("admin").includes(membership.role)) {
    return { ok: false, response: NextResponse.json({ error: "Your role cannot send camp mail" }, { status: 403 }) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }

  return { ok: true, membership, userId: user.id, supabase };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function fromZod(error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] }) {
  const first = error.issues[0];
  const path = first ? first.path.map(String).join(".") : "";
  return badRequest(first ? `${path || "body"}: ${first.message}` : "Invalid request body");
}

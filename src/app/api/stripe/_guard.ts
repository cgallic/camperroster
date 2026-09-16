import { NextResponse } from "next/server";
import { getMembership, rolesForArea, type Membership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Money is registrar/director work. Route handlers cannot use `requireRole`,
 * which redirects; they need a JSON refusal, so this mirrors the cabins guard
 * and answers with a status code instead.
 */
export async function requireFinanceAdmin(): Promise<
  | { ok: true; membership: Membership; userId: string }
  | { ok: false; response: NextResponse }
> {
  const membership = await getMembership();
  if (!membership) {
    return { ok: false, response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }
  if (!rolesForArea("admin").includes(membership.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Your role cannot touch payments" }, { status: 403 }),
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }
  return { ok: true, membership, userId: user.id };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

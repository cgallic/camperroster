import { NextResponse } from "next/server";
import { getMembership, rolesForArea, type Membership, type Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Guarded = {
  membership: Membership;
  userId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

/**
 * Same shape as the cabins guard: route handlers need a JSON refusal, not a
 * redirect, because the caller is `fetch` rather than a browser navigation.
 *
 * `extraRoles` narrows further for the financial workbook. Money is the
 * registrar's and the director's; a counselor or a nurse who can otherwise see
 * the admin area has no business downloading what a family paid.
 */
export async function requireExportAccess(
  allowed: Role[] = rolesForArea("admin")
): Promise<{ ok: true } & Guarded | { ok: false; response: NextResponse }> {
  const membership = await getMembership();
  if (!membership) {
    return { ok: false, response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }
  if (!allowed.includes(membership.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Your role cannot run this report" }, { status: 403 }),
    };
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

/** The role set allowed near money. */
export const FINANCE_ROLES: Role[] = ["director", "registrar"];

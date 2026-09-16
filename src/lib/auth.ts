import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export const ROLES = ["director", "registrar", "nurse", "red_shirt", "counselor", "staff"] as const;
export type Role = (typeof ROLES)[number];

export type Membership = { campId: string; role: Role };

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

export async function getMembership(): Promise<Membership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("camp_members")
    .select("camp_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return data ? { campId: data.camp_id, role: data.role as Role } : null;
}

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

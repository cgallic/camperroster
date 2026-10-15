import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentCamp, getCurrentUser, ROLES } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { lastDirectorProblem } from "@/lib/team";

async function directorContext() {
  const [camp, user] = await Promise.all([getCurrentCamp(), getCurrentUser()]);
  if (!user) return { response: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) } as const;
  if (!camp || camp.role !== "director") return { response: NextResponse.json({ error: "Only a camp director can change team access." }, { status: 403 }) } as const;
  return { camp, user } as const;
}

async function teamFor(campId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("camp_members").select("user_id, role").eq("camp_id", campId);
  if (error) throw error;
  return (data ?? []).map((row) => ({ userId: row.user_id, role: row.role }));
}

const RoleChangeSchema = z.object({ userId: z.string().uuid(), role: z.enum(ROLES) });

export async function PATCH(request: Request) {
  const context = await directorContext();
  if ("response" in context) return context.response;
  const parsed = RoleChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A team member and a valid role are required." }, { status: 400 });

  const members = await teamFor(context.camp.campId);
  if (!members.some((member) => member.userId === parsed.data.userId)) {
    return NextResponse.json({ error: "That person is not on this camp's team." }, { status: 404 });
  }
  const problem = lastDirectorProblem(members, parsed.data.userId, parsed.data.role);
  if (problem) return NextResponse.json({ error: problem }, { status: 409 });

  // The director's own session, not the service role, so the audit log
  // records who made the change. RLS lets directors update their camp's team.
  const db = await createClient();
  const { data, error } = await db.from("camp_members")
    .update({ role: parsed.data.role })
    .eq("camp_id", context.camp.campId)
    .eq("user_id", parsed.data.userId)
    .select("user_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "The role was not changed. Refresh and try again." }, { status: 409 });
  return NextResponse.json({ ok: true, userId: parsed.data.userId, role: parsed.data.role });
}

export async function DELETE(request: Request) {
  const context = await directorContext();
  if ("response" in context) return context.response;
  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });
  if (userId === context.user.id) return NextResponse.json({ error: "You cannot remove your own access." }, { status: 409 });

  const members = await teamFor(context.camp.campId);
  if (!members.some((member) => member.userId === userId)) {
    return NextResponse.json({ error: "That person is not on this camp's team." }, { status: 404 });
  }
  const problem = lastDirectorProblem(members, userId, null);
  if (problem) return NextResponse.json({ error: problem }, { status: 409 });

  const db = await createClient();
  const { data, error } = await db.from("camp_members").delete().eq("camp_id", context.camp.campId).eq("user_id", userId).select("user_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Access was not removed. Refresh and try again." }, { status: 409 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getCurrentCamp, getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  const [camp, user] = await Promise.all([getCurrentCamp(), getCurrentUser()]);
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (!camp || camp.role !== "director") return NextResponse.json({ error: "Only a camp director can remove team access." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });
  if (userId === user.id) return NextResponse.json({ error: "You cannot remove your own access." }, { status: 409 });

  const admin = createAdminClient();
  const { data: member } = await admin.from("camp_members").select("role").eq("camp_id", camp.campId).eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "That person is not on this camp's team." }, { status: 404 });
  if (member.role === "director") {
    const { count } = await admin.from("camp_members").select("user_id", { count: "exact", head: true }).eq("camp_id", camp.campId).eq("role", "director");
    if ((count ?? 0) <= 1) return NextResponse.json({ error: "A camp must keep at least one director." }, { status: 409 });
  }
  const { error } = await admin.from("camp_members").delete().eq("camp_id", camp.campId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

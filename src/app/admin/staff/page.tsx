import StaffHeader from "@/components/StaffHeader";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import StaffManagerClient from "./StaffManagerClient";

export const dynamic = "force-dynamic";

export default async function StaffManagementPage() {
  const membership = await requireRole(["director"], "/admin/staff");
  const admin = createAdminClient();
  const [{ data: rows }, { data: invitations }, user] = await Promise.all([
    admin.from("camp_members").select("user_id, role, created_at").eq("camp_id", membership.campId).order("created_at"),
    (admin as any).from("staff_invitations")
      .select("id,email,role,invited_at,expires_at")
      .eq("camp_id", membership.campId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("invited_at", { ascending: false }),
    getCurrentUser(),
  ]);
  const members = await Promise.all((rows ?? []).map(async (row) => {
    const { data } = await admin.auth.admin.getUserById(row.user_id);
    return { userId: row.user_id, role: row.role, email: data.user?.email ?? "Account pending", createdAt: row.created_at };
  }));
  return <><StaffHeader /><StaffManagerClient initialMembers={members} initialInvitations={invitations ?? []} currentUserId={user?.id ?? ""} /></>;
}

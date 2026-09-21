import StaffHeader from "@/components/StaffHeader";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import StaffManagerClient from "./StaffManagerClient";

export const dynamic = "force-dynamic";

export default async function StaffManagementPage() {
  const membership = await requireRole(["director"], "/admin/staff");
  const admin = createAdminClient();
  const { data: rows } = await admin.from("camp_members").select("user_id, role, created_at").eq("camp_id", membership.campId).order("created_at");
  const members = await Promise.all((rows ?? []).map(async (row) => {
    const { data } = await admin.auth.admin.getUserById(row.user_id);
    return { userId: row.user_id, role: row.role, email: data.user?.email ?? "Account pending", createdAt: row.created_at };
  }));
  return <><StaffHeader /><StaffManagerClient initialMembers={members} /></>;
}

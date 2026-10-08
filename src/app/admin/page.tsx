/* eslint-disable @typescript-eslint/no-explicit-any */

import { redirect } from "next/navigation";
import { getMembership, requireArea, rolesForArea } from "@/lib/auth";
import { homeForRole } from "@/lib/staff-navigation";
import { createClient } from "@/lib/supabase/server";
import StaffHeader from "@/components/StaffHeader";
import AdminDashboardClient from "./AdminDashboardClient";
import {
  buildTriageItems,
  campersDisplayCount,
  volsDisplayCount,
  HEALTH_SELECT,
  REFERENCE_SELECT,
} from "./triage";

export default async function AdminDashboardPage() {
  // Sign-in lands everyone here; send nurses, counselors and staff to their own
  // workspace instead of a "no access" page.
  const membership = await getMembership();
  if (membership && !rolesForArea("admin").includes(membership.role)) redirect(homeForRole(membership.role));
  await requireArea("admin", "/admin");

  const supabase = await createClient();

  const [{ count: regCount }, { count: volCount }, { data: healthData }, { data: refData }] = await Promise.all([
    supabase.from("registrations").select("*", { count: "exact", head: true }),
    supabase.from("staff_applications").select("*", { count: "exact", head: true }),
    supabase.from("health_profiles").select(HEALTH_SELECT).eq("has_allergies", true),
    supabase.from("staff_references").select(REFERENCE_SELECT).limit(5),
  ]);

  return (
    <>
      <StaffHeader />
      <AdminDashboardClient
        initialCampersCount={campersDisplayCount(regCount)}
        initialVolsCount={volsDisplayCount(volCount)}
        initialTriageItems={buildTriageItems(healthData as any[] | null, refData as any[] | null)}
      />
    </>
  );
}

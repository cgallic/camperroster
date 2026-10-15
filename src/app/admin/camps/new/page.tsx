import StaffHeader from "@/components/StaffHeader";
import { requireRole } from "@/lib/auth";
import NewCampClient from "./NewCampClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up a customer camp", robots: { index: false, follow: false } };

export default async function NewCampPage() {
  await requireRole(["director"], "/admin/camps/new");
  return <><StaffHeader /><NewCampClient /></>;
}

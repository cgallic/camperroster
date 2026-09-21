import { requireRole } from "@/lib/auth";
import StaffHeader from "@/components/StaffHeader";
import CheckinClient from "./CheckinClient";

export default async function AdminCheckinRoute() {
  await requireRole(["director", "registrar", "staff"], "/admin/checkin");
  return (
    <>
      <StaffHeader />
      <CheckinClient />
    </>
  );
}

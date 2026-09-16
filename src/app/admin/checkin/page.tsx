import { requireArea } from "@/lib/auth";
import StaffHeader from "@/components/StaffHeader";
import CheckinClient from "./CheckinClient";

export default async function AdminCheckinRoute() {
  await requireArea("admin", "/admin/checkin");
  return (
    <>
      <StaffHeader />
      <CheckinClient />
    </>
  );
}

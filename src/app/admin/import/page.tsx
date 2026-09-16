import { requireArea } from "@/lib/auth";
import StaffHeader from "@/components/StaffHeader";
import ImportClient from "./ImportClient";

export default async function AdminImportRoute() {
  await requireArea("admin", "/admin/import");
  return (
    <>
      <StaffHeader />
      <ImportClient />
    </>
  );
}

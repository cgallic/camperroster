import { requireArea } from "@/lib/auth";
import StaffHeader from "@/components/StaffHeader";
import BunkNotesClient from "./BunkNotesClient";

export default async function AdminBunkNotesRoute() {
  await requireArea("admin", "/admin/bunk-notes");
  return (
    <>
      <StaffHeader />
      <BunkNotesClient />
    </>
  );
}

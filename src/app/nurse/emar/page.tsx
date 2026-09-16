import { requireArea } from "@/lib/auth";
import StaffHeader from "@/components/StaffHeader";
import EmarClient from "./EmarClient";

export default async function NurseEmarRoute() {
  await requireArea("nurse", "/nurse/emar");
  return (
    <>
      <StaffHeader />
      <EmarClient />
    </>
  );
}

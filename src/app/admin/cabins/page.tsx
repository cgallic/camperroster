import { requireArea } from "@/lib/auth";
import StaffHeader from "@/components/StaffHeader";
import CabinBoardClient from "./CabinBoardClient";
import { loadCabinBoard, loadWaitlist } from "./data";

export const dynamic = "force-dynamic";

export default async function CabinBoardPage() {
  await requireArea("admin", "/admin/cabins");

  const [cabins, waitlist] = await Promise.all([loadCabinBoard(), loadWaitlist()]);

  return (
    <>
      <StaffHeader />
      <CabinBoardClient initialCabins={cabins} initialWaitlist={waitlist} />
    </>
  );
}

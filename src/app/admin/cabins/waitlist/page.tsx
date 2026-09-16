import Link from "next/link";
import { requireArea } from "@/lib/auth";
import StaffHeader from "@/components/StaffHeader";
import WaitlistClient from "./WaitlistClient";
import { loadCabinBoard, loadWaitlist } from "../data";

export const dynamic = "force-dynamic";

export default async function WaitlistPage() {
  await requireArea("admin", "/admin/cabins/waitlist");

  const [entries, cabins] = await Promise.all([loadWaitlist(), loadCabinBoard()]);

  return (
    <>
      <StaffHeader />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <Link href="/admin/cabins" className="text-xs font-bold text-forest-800 hover:underline">
          ← Back to cabin board
        </Link>
      </div>
      <WaitlistClient entries={entries} cabins={cabins} />
    </>
  );
}

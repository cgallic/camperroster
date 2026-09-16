import { requireArea } from "@/lib/auth";
import StaffHeader from "@/components/StaffHeader";
import CounselorRosterClient from "./CounselorRosterClient";

export default async function CounselorRosterRoute() {
  await requireArea("counselor", "/counselor");
  return (
    <>
      <StaffHeader />
      <CounselorRosterClient />
    </>
  );
}

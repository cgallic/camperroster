import { requireArea } from "@/lib/auth";
import StaffHeader from "@/components/StaffHeader";
import CanteenPosClient from "./CanteenPosClient";

export default async function CanteenPosRoute() {
  await requireArea("canteen", "/canteen/pos");
  return (
    <>
      <StaffHeader />
      <CanteenPosClient />
    </>
  );
}

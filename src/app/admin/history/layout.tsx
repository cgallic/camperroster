import type { ReactNode } from "react";
import StaffHeader from "@/components/StaffHeader";
import { requireRole } from "@/lib/auth";

export default async function HistoryLayout({ children }: { children: ReactNode }) {
  await requireRole(["director"], "/admin/history");

  return (
    <>
      <StaffHeader />
      {children}
    </>
  );
}

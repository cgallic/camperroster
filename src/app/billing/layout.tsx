import type { ReactNode } from "react";
import StaffHeader from "@/components/StaffHeader";

export default function BillingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StaffHeader />
      {children}
    </>
  );
}

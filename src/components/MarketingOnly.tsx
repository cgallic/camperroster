"use client";

import { usePathname } from "next/navigation";
import { STAFF_PREFIXES } from "@/lib/staff-navigation";

/**
 * The marketing navbar and footer belong on the public site. Inside the staff
 * app they stacked a second sticky header (with "Get Started" and pricing
 * links) on top of StaffHeader, so they are left out there.
 */
export default function MarketingOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const inStaffApp = STAFF_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  return inStaffApp ? null : <>{children}</>;
}

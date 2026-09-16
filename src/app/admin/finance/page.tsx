import { requireArea } from "@/lib/auth";
import StaffHeader from "@/components/StaffHeader";
import FinanceClient from "./FinanceClient";
import { loadFinance } from "./data";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  await requireArea("admin", "/admin/finance");

  const { families, aid } = await loadFinance();

  return (
    <>
      <StaffHeader />
      <FinanceClient families={families} aid={aid} />
    </>
  );
}

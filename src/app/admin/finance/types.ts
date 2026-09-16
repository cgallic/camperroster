import type { PaymentPlan } from "@/lib/pricing";

export type PaymentLine = {
  id: string;
  amountCents: number;
  refundedCents: number;
  status: string;
  paidAt: string | null;
  note: string | null;
  isOffline: boolean;
};

export type ScheduleLine = {
  id: string;
  dueOn: string;
  amountCents: number;
  status: string;
};

export type FamilyFinance = {
  invoiceId: string;
  familyId: string;
  householdName: string;
  camperCount: number;
  plan: PaymentPlan;
  tierCents: number;
  customTotalCents: number | null;
  financialAidCents: number;
  processingFeeCents: number;
  totalDueCents: number;
  paidCents: number;
  refundedCents: number;
  balanceCents: number;
  nextDueOn: string | null;
  payments: PaymentLine[];
  schedule: ScheduleLine[];
};

export type AidApplication = {
  id: string;
  familyId: string;
  householdName: string;
  requestedCents: number | null;
  awardedCents: number | null;
  status: string;
  narrative: string | null;
  decidedAt: string | null;
};

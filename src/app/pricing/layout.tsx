import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Pay Per Camper, $0 Off-Season",
  description: "Pay only when campers register and nothing through the winter. Includes volunteer reference tracking, health lodge eMAR, and bunk notes printing.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing - Pay Per Camper, $0 Off-Season",
    description: "Pay only when campers register and nothing through the winter. Includes volunteer reference tracking, health lodge eMAR, and bunk notes printing.",
    url: "/pricing",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

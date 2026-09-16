import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Pay Per Camper, $0 Off-Season",
  description: "Pay only when campers register and nothing through the winter. Includes automated voice reference checks, health lodge eMAR, and parent bunk notes.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing - Pay Per Camper, $0 Off-Season",
    description: "Pay only when campers register and nothing through the winter. Includes automated voice reference checks, health lodge eMAR, and parent bunk notes.",
    url: "/pricing",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

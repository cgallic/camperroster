import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cashless Camp Canteen POS and Parent Wallet",
  description: "Campers scan a wristband at the snack shack and parents reload online. Eliminate lost cash, paper camp bank ledgers, and register lines with a cashless canteen POS.",
  alternates: { canonical: "/cashless-camp-canteen-pos" },
  openGraph: {
    title: "Cashless Camp Canteen POS and Parent Wallet",
    description: "Campers scan a wristband at the snack shack and parents reload online. Eliminate lost cash, paper camp bank ledgers, and register lines with a cashless canteen POS.",
    url: "/cashless-camp-canteen-pos",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

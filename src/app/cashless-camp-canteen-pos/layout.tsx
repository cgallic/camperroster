import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cashless Camp Canteen POS and Parent Wallet",
  description: "Run the camp store without cash. Staff find the camper by name, charge their canteen wallet, and every sale is logged. Works on any phone, tablet or laptop.",
  alternates: { canonical: "/cashless-camp-canteen-pos" },
  openGraph: {
    title: "Cashless Camp Canteen POS and Parent Wallet",
    description: "Run the camp store without cash. Staff find the camper by name, charge their canteen wallet, and every sale is logged. Works on any phone, tablet or laptop.",
    url: "/cashless-camp-canteen-pos",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

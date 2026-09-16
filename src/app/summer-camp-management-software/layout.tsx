import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Summer Camp Management Software and Registration",
  description: "Registration, health lodge eMAR, cabin rosters, and canteen POS for residential and day camps. Eliminate paper forms without paying a year-round software retainer.",
  alternates: { canonical: "/summer-camp-management-software" },
  openGraph: {
    title: "Summer Camp Management Software and Registration",
    description: "Registration, health lodge eMAR, cabin rosters, and canteen POS for residential and day camps. Eliminate paper forms without paying a year-round software retainer.",
    url: "/summer-camp-management-software",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CampDoc Alternative With Built-In Health Lodge eMAR",
  description: "Replace CampDoc's $6-$12 per-camper fee and the second parent login. CamperRoster includes health lodge eMAR with offline medication logging, registration, and canteen POS in one platform.",
  alternates: { canonical: "/campdoc-alternative" },
  openGraph: {
    title: "CampDoc Alternative With Built-In Health Lodge eMAR",
    description: "Replace CampDoc's $6-$12 per-camper fee and the second parent login. CamperRoster includes health lodge eMAR with offline medication logging, registration, and canteen POS in one platform.",
    url: "/campdoc-alternative",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

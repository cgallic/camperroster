import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CampMinder Alternative for Small Camps",
  description: "A CampMinder alternative for church, nonprofit, day, and overnight camps: published pricing of $4-$6 per registered camper, $0/month off-season, and $0 setup.",
  alternates: { canonical: "/campminder-alternative" },
  openGraph: {
    title: "CampMinder Alternative for Small Camps",
    description: "A CampMinder alternative for church, nonprofit, day, and overnight camps: published pricing of $4-$6 per registered camper, $0/month off-season, and $0 setup.",
    url: "/campminder-alternative",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

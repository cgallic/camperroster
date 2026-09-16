import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UltraCamp Alternative With No Winter Retainer",
  description: "UltraCamp bills $275-$975 a month through the off-season. CamperRoster charges $0/month in winter and only when campers register, with a mobile-first parent checkout.",
  alternates: { canonical: "/ultracamp-alternative" },
  openGraph: {
    title: "UltraCamp Alternative With No Winter Retainer",
    description: "UltraCamp bills $275-$975 a month through the off-season. CamperRoster charges $0/month in winter and only when campers register, with a mobile-first parent checkout.",
    url: "/ultracamp-alternative",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

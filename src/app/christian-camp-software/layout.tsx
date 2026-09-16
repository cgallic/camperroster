import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Christian Camp Software for Retreats and Ministry",
  description: "Camp management built for Christian camps, retreats, and ministry centers: pastoral reference calling, group church invoicing, and no off-season retainer.",
  alternates: { canonical: "/christian-camp-software" },
  openGraph: {
    title: "Christian Camp Software for Retreats and Ministry",
    description: "Camp management built for Christian camps, retreats, and ministry centers: pastoral reference calling, group church invoicing, and no off-season retainer.",
    url: "/christian-camp-software",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

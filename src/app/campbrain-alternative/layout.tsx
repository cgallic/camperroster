import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CampBrain Alternative - No Setup Fee, Mobile First",
  description: "CampBrain charges setup fees near $5,000 and needs weeks of seasonal staff training. CamperRoster is mobile-first, sets up in a day, and costs nothing in the off-season.",
  alternates: { canonical: "/campbrain-alternative" },
  openGraph: {
    title: "CampBrain Alternative - No Setup Fee, Mobile First",
    description: "CampBrain charges setup fees near $5,000 and needs weeks of seasonal staff training. CamperRoster is mobile-first, sets up in a day, and costs nothing in the off-season.",
    url: "/campbrain-alternative",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

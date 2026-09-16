import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Church Camp Registration Software",
  description: "Registration, room assignment, and automated reference calls for youth pastors, church retreats, and denominational camps. Purpose-built, with no winter retainer.",
  alternates: { canonical: "/church-camp-registration-software" },
  openGraph: {
    title: "Church Camp Registration Software",
    description: "Registration, room assignment, and automated reference calls for youth pastors, church retreats, and denominational camps. Purpose-built, with no winter retainer.",
    url: "/church-camp-registration-software",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

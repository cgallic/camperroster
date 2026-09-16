import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Camp Volunteer Reference Check Software",
  description: "Automate staff and volunteer reference checks with AI voice calls. Two-minute structured reference interviews, transcribed and scored, instead of 40+ hours of phone tag.",
  alternates: { canonical: "/camp-volunteer-reference-check-software" },
  openGraph: {
    title: "Camp Volunteer Reference Check Software",
    description: "Automate staff and volunteer reference checks with AI voice calls. Two-minute structured reference interviews, transcribed and scored, instead of 40+ hours of phone tag.",
    url: "/camp-volunteer-reference-check-software",
    type: "website"
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
